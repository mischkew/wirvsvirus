import L from 'leaflet';

/**
 * Convert an objects x and y fields into a Leaflet L.LatLng object.
 * @param {any} positionObject An object containing x and y properties.
 * @returns {L.LatLng}
 */
export function getPosition(positionObject) {
  // x --> longitude
  // y --> latitude
  return L.latLng(positionObject.y, positionObject.x);
}
