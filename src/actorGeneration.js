import graph from '../data/stations.json';
import actorTemplate from '../data/actor.json';

const HEALTHY = 0;
const INFECTED = 1;
const RECOVERED = 2;
const DEAD = 3;

const WAITING = 0;
const TRASITIONING = 1;

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

  entry.stay_until = sampleTime(
    template.stay_until.time,
    template.stay_until.variance
  );

  return entry;
}

export function generateActors(actorTemplate, stations) {
  const station_names = Object.keys(stations);
  const actors = Array.from(Array(actorTemplate.count).keys()).map(index => {
    const schedule = actorTemplate.schedule.map(scheduleTemplate =>
      generateScheduleEntry(scheduleTemplate, station_names)
    );
    const station_location = stations[schedule[0].station].position;
    const actor = {
      status: HEALTHY,
      schedule,
      position: {
        x: station_location.x,
        y: station_location.y,
      },
      current_station: schedule[0],
      current_schedule: 0,
      state: WAITING,
    };

    return actor;
  });

  return actors;
}
