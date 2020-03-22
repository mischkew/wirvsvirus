import React from 'react';
import PropTypes from 'prop-types';
import { getPosition, getEdges } from '../utils';
import { Polyline } from 'react-leaflet';
import { BLUE_DARK, BLUE_DARKER } from '../branding';

export default function Edges({ stations }) {
  const polylineStations = getEdges(stations)
    .filter(({ start, end }) => {
      return (
        stations[start].type === 'station' && stations[end].type === 'station'
      );
    })
    .map(({ start, end }) => {
      return [getPosition(stations[start]), getPosition(stations[end])];
    });
  const polylineStreets = getEdges(stations)
    .filter(({ start, end }) => {
      return (
        stations[start].type === 'street' || stations[end].type === 'street'
      );
    })
    .map(({ start, end }) => {
      return [getPosition(stations[start]), getPosition(stations[end])];
    });
  return (
    <React.Fragment>
      <Polyline positions={polylineStreets} color={BLUE_DARKER} weight={2} />
      <Polyline positions={polylineStations} color={BLUE_DARK} weight={3} />
    </React.Fragment>
  );
}

Edges.propTypes = {
  stations: PropTypes.object.isRequired,
};
