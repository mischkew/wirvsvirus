export function generatePredecessorMap(start, stations) {
  let queue = [];
  let seen = new Set();
  let predecessor = {
    [start]: null,
  };
  seen.add(start);
  queue.push(start);

  while (queue.length > 0) {
    const currentStation = queue.shift();
    if (stations[currentStation] === undefined) {
      throw new Error(
        `Station ${currentStation} not in station list. Type: ${typeof currentStation}`
      );
    }
    stations[currentStation].next_stops.forEach(station => {
      if (!seen.has(station)) {
        predecessor[station] = currentStation;
        seen.add(station);
        queue.push(station);
      }
    });
  }

  if (Object.keys(predecessor).length < Object.keys(stations).length) {
    // throw new Error('Graph is not connected!');
  }

  return predecessor;
}

export function getLargestCC(stations) {
  const map = generatePredecessorMap(Object.keys(stations)[0], stations);
  const cc = {};

  Object.entries(stations).forEach(([key, value]) => {
    if (key in map) {
      cc[key] = value;
    }
  });

  return cc;
}

export function generatePathFromPredecessorMap(map, end) {
  let currentStation = end;
  let path = [];
  while (currentStation !== null) {
    path.unshift(currentStation);
    currentStation = map[currentStation];
    if (currentStation === undefined) {
      throw new Error(
        'Graph is not connected! Maybe there is an unidirectional edge?'
      );
    }
  }

  return path;
}

export function generatePath(start, end, stations) {
  return generatePathFromPredecessorMap(
    generatePredecessorMap(start, stations),
    end
  );
}

export function generatePaths(stations) {
  let paths = {};
  let maps = {};
  Object.keys(stations).forEach((station, index, arr) => {
    maps[station] = generatePredecessorMap(station, stations);
  });

  Object.entries(maps).forEach(([start, map]) => {
    paths[start] = {};
    Object.keys(stations).forEach(end => {
      paths[start][end] = generatePathFromPredecessorMap(map, end);
    });
  });

  return paths;
}

export function generatePredecessorMaps(stations) {
  let maps = {};
  Object.keys(stations).forEach((station, index, arr) => {
    maps[station] = generatePredecessorMap(station, stations);
  });

  return maps;
}
