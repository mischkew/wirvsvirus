import L, { Util } from 'leaflet';
import regl from 'regl';
import { generatePaths, generateActors } from '../actorGeneration';
import { Simulator } from '../simulation';
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

    // TODO: only get the first iteration for now
    const agents = this._simulation.step();

    this._frameLoop = this._regl.frame(() => {
      // TODO: generate agents here in a loop!
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
      const stations = agents.map(
        agent => agent.schedule[agent.current_schedule].station
      );
      const coordinates = stations.map(station =>
        this._map.latLngToContainerPoint(stationPositions.get(station))
      );

      this._regl({
        frag: `
          precision mediump float;

          // input RGB color with values between 0 and 255
          varying vec3 frag_color;

          void main() {
            // colors need to be mapped between 0 and 1
            gl_FragColor = vec4(frag_color / 255.0, 1.0);
          }
      `,
        vert: `
          precision lowp float;

          attribute vec2 position;

          uniform float pointWidth;
          uniform vec3 color;
          uniform float mapWidth;
          uniform float mapHeight;

          varying vec3 frag_color;

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
            vec2 offset = randomOffset();

            gl_PointSize = pointWidth;
            gl_Position = vec4(normalizeCoords(position) + offset, 0.0, 1.0);
          }
      `,
        attributes: {
          position: coordinates.map(c => [c.x, c.y]),
        },
        uniforms: {
          pointWidth: 3.0,
          color: HEALTHY_RGB,
          mapWidth: mapSize.x,
          mapHeight: mapSize.y,
        },
        count: coordinates.length,
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

    this._simulation = this._initSimulation();
    this._draw = this._buildDraw();
  },

  updateStations: function(stations) {
    this._stations = stations;
    this._reset();
  },

  updateOptions: function(options) {
    Util.setOptions(this, options);
    this._reset();
  },
});

export default L.AgentsLayer;
