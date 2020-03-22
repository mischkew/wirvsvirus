import L, { Util } from 'leaflet';
import regl from 'regl';
import { TRAVEL_TIME } from '../simulation';
import { TRANSPARENT_RGBA, HEALTHY_RGB } from '../branding';
import SimulationWorker from 'workerize-loader!../simulationWorker'; // eslint-disable-line import/no-webpack-loader-syntax

//
// Leaflet Layer
//

L.AgentsLayer = L.Layer.extend({
  options: {
    // will be passed on instantiation
    // contains simulation settings from the user
    // see `data-design/actor.json`
    simulation: null,

    // a callback which is called everytime the agent loop updated, i.e. can be
    // used to display simulation progress outside of the layer via react
    onUpdate: ({ count, day, time }) => {},

    // speed of the simulation in ticks. Minimum 1. The highter the number, the
    // faster the simulation runs. This parameter basically tells the renderer
    // to only update every `simulationSpeed` ticks.
    simulationSpeed: 1,
  },

  initialize: function(stations, options) {
    Util.setOptions(this, options);
    if (this.options.simulation === null) {
      throw new Error('Simulation options must be set!');
    }

    this._stations = stations;
  },

  onAdd: function(map) {
    this._map = map;
    this._canvas = this._initCanvas(map);
    this._regl = this._initRegl(this._canvas);

    // this is the agents buffer, which will get upated by the worker loop
    this._agents = [];
    this._simulation = this._initSimulation();

    if (this.options.pane) {
      this.getPane().appendChild(this._canvas);
    } else {
      map._panes.overlayPane.appendChild(this._canvas);
    }

    map.on('move', this._reset, this);
    map.on('resize', this._resize, this);

    this._reset();
    this._render();
  },

  _initCanvas: function() {
    const canvas = L.DomUtil.create('canvas', 'webgl-canvas leaflet-layer');

    // place the canvas on top of the map, in the middle of the screen
    const originProp = L.DomUtil.testProp([
      'transformOrigin',
      'WebkitTransformOrigin',
      'msTransformOrigin',
    ]);
    canvas.style[originProp] = '50% 50%';

    // make the canvas cover the whole map
    const size = this._map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.style.position = 'absolute';

    // leaflet renders svg on z-index 200, so we put the canvas on top
    canvas.style.zIndex = 201;

    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(
      canvas,
      'leaflet-zoom-' + (animated ? 'animated' : 'hide')
    );

    return canvas;
  },

  _initRegl: function(canvas) {
    try {
      const context =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return regl(context);
    } catch (e) {
      throw new Error('WebGL is not supported in your browser.');
    }
  },

  _initSimulation: function() {
    const worker = SimulationWorker();

    // fill the agents buffer so the rendering loop can access the simulation
    // progress
    worker.addEventListener('message', event => {
      if (event.data && event.data.type && event.data.type === 'RPC') {
        return;
      }
      // console.time('event parse');
      this._agents = event.data;
      // console.timeEnd('event parse');
    });

    // kill the worker when an error happened
    worker.addEventListener('error', event => {
      console.error(event);
      worker.destroySimulation();
      worker.terminate();
    });

    // launch the worker
    worker.setupSimulation(this.options.simulation, this._stations);
    worker.runSimulation(this.options.simulationSpeed);

    return worker;
  },

  _render: function() {
    this._draw = this._buildDraw();

    this._frameLoop = this._regl.frame(() => {
      let day = null;
      let time = null;
      if (this._agents.length === 3) {
        day = this._agents[0];
        time = this._agents[1];
      }

      this.options.onUpdate({
        day,
        time,
        count: this.options.simulation.count,
      });

      this._regl.clear({
        color: TRANSPARENT_RGBA,
      });

      this._draw();
    });
  },

  _buildDraw: function() {
    const mapSize = this._map.getSize();

    return function draw() {
      // console.time('render');
      if (this._agents.length !== 3) {
        // no agents computed yet, must have 3 element according to protocol
        return;
      }

      // console.time('coords');
      const [day, time, agents] = this._agents;
      const startCoordinates = agents.map(agent => {
        // according to protocol the latlng values of the start position are
        // stored in field 0
        const point = this._map.latLngToContainerPoint(agent[0]);
        return [point.x, point.y];
      });
      const endCoordinates = agents.map(agent => {
        // according to protocol the latlng values of the end position are
        // stored in field 1
        const point = this._map.latLngToContainerPoint(agent[1]);
        return [point.x, point.y];
      });
      // console.timeEnd('coords');

      // console.time('regl');
      this._regl({
        frag: `
          precision lowp float;

          // input RGB color with values between 0 and 255
          varying vec3 frag_color;

          void main() {
            // colors need to be mapped between 0 and 1
            gl_FragColor = vec4(frag_color / 255.0, 1.0);
          }
      `,
        vert: `
          precision lowp float;

          attribute vec2 startCoordinate;
          attribute vec2 endCoordinate;

          // "boolean" flag if the agent is currently waiting. As no boolean
          // values exist in GLSL, we pass a float.
          attribute float isWaiting;

          uniform float pointWidth;
          uniform vec3 color;
          uniform float mapWidth;
          uniform float mapHeight;

          // delta of the rendering time since last update
          uniform float deltaTime;

          // time progress of the simulation
          uniform float globalTime;
          uniform float globalDay;

          // the amount of time it takes to go from start to end in simulation time
          uniform float travelTime;

          varying vec3 frag_color;

          // We assume that each start and end position is equi-distanced in the
          // graph and takes the same amount of time for each agent to reach.
          // Every trafficInterval ticks, an agent can travel from one station
          // to the next, which in turn takes trafficInterval ticks. Based on
          // these assumption we can render the position of the agents on the
          // route.
          vec2 positionOnRoute() {
            float remainder = mod(globalTime, travelTime);
            float travelProgressFactor = 0.0;

            // we are not waiting, so interpolate the point between start and end
            if (isWaiting < 0.5) {
              travelProgressFactor = remainder / travelTime;
            }

            return startCoordinate + travelProgressFactor * (endCoordinate - startCoordinate);
          }

          // helper function to transform from pixel space to normalized device
          // coordinates (NDC) in NDC (0,0) is the middle, (-1, 1) is the top
          // left and (1, -1) is the bottom right.
          vec2 normalizeCoords(vec2 position) {
            // read in the positions into x and y vars
            float x = position[0];
            float y = position[1];

            return vec2(
              2.0 * ((x / mapWidth) - 0.5),
              -2.0 * ((y / mapHeight) - 0.5)
            );
          }

          void main() {
            frag_color = color;

            gl_PointSize = pointWidth;
            gl_Position = vec4(normalizeCoords(positionOnRoute()), 0.0, 1.0);
          }
      `,
        attributes: {
          startCoordinate: startCoordinates,
          endCoordinate: endCoordinates,
          // according to proctol, the isWaiting flag is stored as a float in
          // agent field 2
          isWaiting: agents.map(agent => agent[2]),
        },
        uniforms: {
          pointWidth: 3.0,
          color: HEALTHY_RGB,
          mapWidth: mapSize.x,
          mapHeight: mapSize.y,
          deltaTime: this._regl.context('deltaTime'),
          travelTime: TRAVEL_TIME,
          globalDay: day,
          globalTime: time,
        },
        count: startCoordinates.length,
        primitive: 'points',
      })();
      // console.timeEnd('regl');

      // console.timeEnd('render');
    };
  },

  _resize: function(event) {
    const size = event.newSize;

    this._canvas.width = size.x;
    this._canvas.height = size.y;

    this._reset();
  },

  _reset: function() {
    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);
  },

  _restart: function() {
    if (this._simulation) {
      this._simulation.destroySimulation();
      this._simulation.terminate();
    }

    this._simulation = this._initSimulation();
    this._draw = this._buildDraw();
  },

  updateStations: function(stations) {
    this._stations = stations;
    this._restart();
  },

  updateOptions: function(options) {
    Util.setOptions(this, options);
    this._restart();
  },
});

export default L.AgentsLayer;
