import L from 'leaflet';

/**
 * Convert an objects lat and lng fields into a Leaflet L.LatLng object.
 * @param {any} positionObject An object containing lat and lng properties.
 * @returns {L.LatLng}
 */
export function getPosition(positionObject) {
  return L.latLng(positionObject.lat, positionObject.lng);
}

/**
 * Traverse the graph of stations and streets and return each edge only once.
 * @param {object} stations Stations graph - Object containing a key per
 *   station, position as lat, lng and a list of next_stops. See
 *   `data-design/stations.json`.
 * @returns {Array<{start: string, end: string}>} List of edges given as object
 *   of start and end, whereby start and end are the station ids.
 */
export function getEdges(stations) {
  const edges = [];
  const seen = new Set();

  function buildHash(station_id, other_station_id) {
    return `start-${station_id}-end-${other_station_id}`;
  }

  function buildEdge(station_id, other_station_id) {
    return { start: station_id, end: other_station_id };
  }

  function addEdge(edge) {
    seen.add(buildHash(edge.start, edge.end));
    edges.push(edge);
  }

  function isMarked(edge) {
    return (
      seen.has(buildHash(edge.start, edge.end)) ||
      seen.has(buildHash(edge.end, edge.start))
    );
  }

  for (let [id, station] of Object.entries(stations)) {
    for (let other_id of station.next_stops) {
      const edge = buildEdge(id, other_id);
      if (!isMarked(edge)) {
        addEdge(edge);
      }
    }
  }

  return edges;
}
