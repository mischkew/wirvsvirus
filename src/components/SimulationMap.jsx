import React from 'react';
import PropTypes from 'prop-types';
import { Map, TileLayer } from 'react-leaflet';

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
  const positionTuple = [position.lat, position.lng];

  function buildBoxTuple() {
    if (box === null) {
      return null;
    }

    return [
      [box.topLeft.lat, box.topLeft.lng],
      [box.bottomRight.lat, box.bottomRight.lng],
    ];
  }

  return (
    <Map
      id="simulation-map"
      center={positionTuple}
      zoom={zoom}
      minZoom={minZoom}
      maxZoom={maxZoom}
      maxBounds={buildBoxTuple()}
    >
      <TileLayer
        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </Map>
  );
}

const positionProp = PropTypes.shape({
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired,
});

const boxProp = PropTypes.shape({
  topLeft: positionProp.isRequired,
  bottomRight: positionProp.isRequired,
});

SimulationMap.propTypes = {
  position: positionProp.isRequired,
  box: boxProp,
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
