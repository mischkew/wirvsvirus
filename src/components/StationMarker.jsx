import React from 'react';
import PropTypes from 'prop-types';
import { CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { getPosition } from '../utils';
import { BLUE_DARK, BLUE_LIGHTER } from '../branding';

export default function StationMarker({ position }) {
  return (
    <CircleMarker
      center={position}
      radius={6}
      weight={3}
      color={BLUE_DARK}
      fillOpacity={1}
      fillColor={BLUE_LIGHTER}
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
