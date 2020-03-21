import L from 'leaflet';

/**
 * Convert an objects lat and lng fields into a Leaflet L.LatLng object.
 * @param {any} positionObject An object containing lat and lng properties.
 * @returns {L.LatLng}
 */
export function getPosition(positionObject) {
  return L.latLng(positionObject.lat, positionObject.lng);
}
