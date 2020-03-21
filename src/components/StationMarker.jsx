import React from 'react';
import PropTypes from 'prop-types';
import { CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { getPosition } from '../utils';

export default function StationMarker({ position }) {
  return (
    <CircleMarker
      center={position}
      radius={6}
      weight={3}
      color="#3b6978" // Color Palette: https://colorhunt.co/palette/177866
      fillOpacity={0.4}
    />
  );
}

StationMarker.propTypes = {
  position: PropTypes.instanceOf(L.LatLng).isRequired,
};

export function renderStationMarkers(stations) {
  return Object.entries(stations).map(([id, station]) => {
    return <StationMarker key={id} position={getPosition(station)} />;
  });
}
