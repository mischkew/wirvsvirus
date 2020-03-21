import React from 'react';
import PropTypes from 'prop-types';
import { Map, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import Edges from './Edges';
import { renderStationMarkers } from './StationMarker';
import { getPosition } from '../utils';
import AgentsLayer from './AgentsLayer';

// required leaflet styles
import 'leaflet/dist/leaflet.css';
import './SimulationMap.css';

export default function SimulationMap({
  position,
  box,
  zoom,
  minZoom,
  maxZoom,
  stations,
}) {
  if (!box.isValid()) {
    throw new Error(`Bounding box is not valid: ${box.toBBoxString()}`);
  }

  if (!box.contains(position)) {
    throw new Error(
      `Map center ${position} is not inside the bounding box ${box.toBBoxString()}`
    );
  }

  for (let [id, station] of Object.entries(stations)) {
    const position = getPosition(station);
    if (!box.contains(position)) {
      throw new Error(
        `Station ${id} at positiion ${position} is not contained in bounding box ${box.toBBoxString()}`
      );
    }
  }

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
      <Edges stations={stations} />
      {renderStationMarkers(stations)}
      {/* TODO: pass actual agents simulation options */}
      <AgentsLayer stations={stations} simulationOptions={{}} />
    </Map>
  );
}

SimulationMap.propTypes = {
  position: PropTypes.instanceOf(L.LatLng).isRequired,
  box: PropTypes.instanceOf(L.LatLngBounds),
  zoom: PropTypes.number,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  stations: PropTypes.object.isRequired,
};

SimulationMap.defaultProps = {
  zoom: 12,
  minZoom: 11,
  maxZoom: 13,
  box: null,
};
