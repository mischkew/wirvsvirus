export function convertStationsToString(stations) {
  return Object.fromEntries(
    Object.entries(stations).map(([key, value]) => {
      const next_stops = value.next_stops.map(stop => {
        return stop + '';
      });
      return [key + '', { ...value, next_stops }];
    })
  );
}

export function selectStationsOnly(locations) {
  return Object.fromEntries(
    Object.entries(locations).reduce((acc, [key, location]) => {
      if (location.type === 'station') {
        const stationNeighbours = location.next_stops.reduce((acc, stop) => {
          if (locations[stop].type === 'station') {
            acc.push(stop);
          }
          return acc;
        }, []);
        location.next_stops = stationNeighbours;
        acc.push([key, location]);
      }
      return acc;
    }, [])
  );
}

/*
    be careful with this one
    Object.keys will output strings and not numbers
    Then the whole path processing breaks
*/
export function convertStationsToInt(stations) {
  return Object.fromEntries(
    Object.entries(stations).map(([key, value]) => {
      const next_stops = value.next_stops.map(stop => {
        return parseInt(stop + '', 10);
      });
      return [parseInt(key + '', 10), { ...value, next_stops }];
    })
  );
}
