export const HEALTHY = 0;
export const INFECTED = 1;
export const RECOVERED = 2;
export const DEAD = 3;

export const WAITING = 0;
export const TRASITIONING = 1;

function selectRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function sampleRange(value, variance) {
  return value - variance + Math.random() * 2 * variance;
}

function sampleTime(time, variance) {
  const timeInMinutes = (time % 100) + Math.floor(time / 100) * 60;
  const varianceInMinutes = (variance % 100) + Math.floor(variance / 100) * 60;

  const sampledMinutes = sampleRange(timeInMinutes, varianceInMinutes);
  return Math.floor(sampledMinutes / 60) * 100 + (sampledMinutes % 60);
}

export function generateScheduleEntry(template, stations) {
  let entry = {};
  entry.station = selectRandom(stations);
  entry.name = template.name; // probably not needed
  entry.probability = sampleRange(
    template.probability.value,
    template.probability.variance
  );

  entry.stay_until = Math.floor(
    sampleTime(template.stay_until.time, template.stay_until.variance)
  );

  return entry;
}

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

export function generatePaths(actors, stations) {
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

export function generateActors(actorTemplate, stations) {
  const station_names = Object.keys(stations);
  const actors = Array.from(Array(actorTemplate.count).keys()).map(index => {
    const schedule = actorTemplate.schedule.map(scheduleTemplate =>
      generateScheduleEntry(scheduleTemplate, station_names)
    );
    let actor = {
      status: HEALTHY,
      schedule,
      current_station: schedule[0].station,
      current_schedule: 0,
      state: WAITING,
      path: null,
      path_position: null,
    };

    return actor;
  });

  return actors;
}
