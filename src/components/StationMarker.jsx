import React from 'react';
import PropTypes from 'prop-types';
import { CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { getPosition } from '../utils';
import { BLUE_DARK } from '../branding';

export default function StationMarker({ position }) {
  return (
    <CircleMarker
      center={position}
      radius={6}
      weight={3}
      color={BLUE_DARK}
      fillOpacity={0.9}
    />
  );
}

StationMarker.propTypes = {
  position: PropTypes.instanceOf(L.LatLng).isRequired,
};

export function renderStationMarkers(stations) {
  return Object.entries(stations)
    .filter(([id, station]) => {
      return station.type === 'station';
    })
    .map(([id, station]) => {
      return <StationMarker key={id} position={getPosition(station)} />;
    });
}
