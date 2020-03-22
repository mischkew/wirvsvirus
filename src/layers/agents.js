import L, { Util } from 'leaflet';
import regl from 'regl';
import { generatePaths, generateActors } from '../actorGeneration';
import { Simulator, WAITING } from '../simulation';
import { getPosition } from '../utils';
import { TRANSPARENT_RGBA, HEALTHY_RGB } from '../branding';

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
    onUpdate: ({ day, time }) => {},
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
    const actors = generateActors(this.options.simulation, this._stations);
    const paths = generatePaths(actors, this._stations);
    return new Simulator(this._stations, actors, paths);
  },

  _render: function() {
    this._draw = this._buildDraw();

    this._frameLoop = this._regl.frame(() => {
      // TODO: generate agents independ of the render loop in a worker thread to
      // control simulation time
      const agents = this._simulation.step();

      this.options.onUpdate({
        day: this._simulation.day,
        time: this._simulation.time,
      });

      this._regl.clear({
        color: TRANSPARENT_RGBA,
      });

      this._draw(agents);
    });
  },

  _buildDraw: function() {
    const stationPositions = new Map(
      Object.entries(this._stations).map(([id, station]) => [
        id,
        getPosition(station),
      ])
    );
    const mapSize = this._map.getSize();

    return function draw(agents) {
      const startCoordinates = agents.map(agent => {
        const station = agent.schedule[agent.current_schedule].station;
        return this._map.latLngToContainerPoint(stationPositions.get(station));
      });
      const endCoordinates = agents.map(agent => {
        const index =
          agent.current_schedule + 1 === agent.schedule.length
            ? 0
            : agent.current_schedule + 1;
        const station = agent.schedule[index].station;
        return this._map.latLngToContainerPoint(stationPositions.get(station));
      });

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

          varying vec3 frag_color;

          // We assume that each start and end position is equi-distanced in the
          // graph and takes the same amount of time for each agent to reach.
          // Every trafficInterval ticks an agent can travel frome one station
          // to the next, which in turn takes trafficInterval ticks. Based on
          // these assumption we can render the position of the agents on the
          // route.
          vec2 positionOnRoute() {
            return startCoordinate;
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
          startCoordinate: startCoordinates.map(c => [c.x, c.y]),
          endCoordinate: endCoordinates.map(c => [c.x, c.y]),
          isWaiting: agents.map(agent => (agent.state === WAITING ? 1.0 : 0.0)),
        },
        uniforms: {
          pointWidth: 3.0,
          color: HEALTHY_RGB,
          mapWidth: mapSize.x,
          mapHeight: mapSize.y,
          deltaTime: this._regl.context('deltaTime'),
          globalTime: this._simulation.time,
        },
        count: startCoordinates.length,
        primitive: 'points',
      })();
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
