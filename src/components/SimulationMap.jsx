import React from 'react';
import PropTypes from 'prop-types';
import { Map, TileLayer } from 'react-leaflet';
import L from 'leaflet';

// required leaflet styles
import 'leaflet/dist/leaflet.css';
import './SimulationMap.css';

export default function SimulationMap({
  position,
  box,
  zoom,
  minZoom,
  maxZoom,
}) {
  return (
    <Map
      id="simulation-map"
      center={position}
      zoom={zoom}
      minZoom={minZoom}
      maxZoom={maxZoom}
      maxBounds={box}
    >
      <TileLayer
        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </Map>
  );
}

SimulationMap.propTypes = {
  position: PropTypes.instanceOf(L.LatLng).isRequired,
  box: PropTypes.instanceOf(L.LatLngBounds),
  zoom: PropTypes.number,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
};

SimulationMap.defaultProps = {
  zoom: 12,
  minZoom: 11,
  maxZoom: 13,
  box: null,
};
