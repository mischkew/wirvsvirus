import L, { Util } from 'leaflet';
import regl from 'regl';

//
// Shader Colors
//

const TRANSPARENT = [0, 0, 0, 0];
const AGENT_HEALTHY_COLOR = [0, 1, 0];

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
    // A dummy simulation providing time and a step function
    // @tbjoerns simulator needs to be created here
    return {
      time: 830,
      step: function() {
        return [];
      },
    };
  },

  _render: function() {
    this._draw = this._buildDraw();
    this._frameLoop = this._regl.frame(() => {
      const agents = this._simulation.step();

      this._regl.clear({
        color: TRANSPARENT,
      });

      this._draw(agents);
    });
  },

  _buildDraw: function() {
    return this._regl({
      frag: `
        precision mediump float;

        varying vec3 frag_color;

        void main() {
          gl_FragColor = vec4(frag_color, 1.0);
        }
      `,
      vert: `
        precision mediump float;

        attribute vec2 position;

        uniform float pointWidth;
        uniform vec3 color;

        varying vec3 frag_color;

        void main() {
          frag_color = color;

          gl_PointSize = pointWidth;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      attributes: {
        position: [[0.0, 0.0]],
      },
      uniforms: {
        pointWidth: 30.0,
        color: AGENT_HEALTHY_COLOR,
      },
      count: 1,
      primitive: 'points',
    });
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
