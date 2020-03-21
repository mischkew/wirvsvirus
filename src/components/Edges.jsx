import React from 'react';
import PropTypes from 'prop-types';
import { getPosition, getEdges } from '../utils';
import { Polyline } from 'react-leaflet';
import { BLUE_DARK } from '../branding';

export default function Edges({ stations }) {
  const polyline = getEdges(stations).map(({ start, end }) => {
    return [getPosition(stations[start]), getPosition(stations[end])];
  });
  return <Polyline positions={polyline} color={BLUE_DARK} weight={3} />;
}

Edges.propTypes = {
  stations: PropTypes.object.isRequired,
};
