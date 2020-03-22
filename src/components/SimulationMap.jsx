import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Map, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import Edges from './Edges';
import { renderStationMarkers } from './StationMarker';
import { getPosition } from '../utils';
import AgentsLayer from './AgentsLayer';
import ProgressLayer from './ProgressLayer';

// required leaflet styles
import 'leaflet/dist/leaflet.css';
import './SimulationMap.css';

function toHours(minutes) {
  const hours = Math.floor(minutes / 60);
  const hourMinutes = minutes - hours * 60;

  let hoursString = `${hours}`;
  if (hoursString.length === 1) {
    hoursString = '0' + hoursString;
  }

  let hourMinutesString = `${hourMinutes}`;
  if (hourMinutesString.length === 1) {
    hourMinutesString = '0' + hourMinutesString;
  }

  return `${hoursString}:${hourMinutesString}`;
}

export default function SimulationMap({
  position,
  box,
  zoom,
  minZoom,
  maxZoom,
  stations,
  simulationOptions,
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

  const [simulationProgress, setSimulationProgress] = useState({
    count: 0,
    day: 0,
    time: 0,
    infectedCount: 0,
  });

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
      <AgentsLayer
        stations={stations}
        simulationOptions={simulationOptions}
        onUpdate={setSimulationProgress}
      />
      <ProgressLayer className="simulation-progress">
        <div>
          <span>
            Infected: {simulationProgress.infectedCount} of{' '}
            {simulationProgress.count}
          </span>
          <span>
            Day: {simulationProgress.day} ({toHours(simulationProgress.time)})
          </span>
        </div>
      </ProgressLayer>
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
  simulationOptions: PropTypes.object.isRequired,
};

SimulationMap.defaultProps = {
  zoom: 12,
  minZoom: 11,
  maxZoom: 13,
  box: null,
};
