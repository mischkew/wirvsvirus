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
    template.dailyProbability.value,
    template.dailyProbability.variance
  );

  entry.stay_until = Math.floor(
    sampleTime(template.stay_until.time, template.stay_until.variance)
  );

  return entry;
}

export function generateActors(actorTemplate, stations) {
  const station_names = Object.keys(stations);
  const actors = Array.from(Array(actorTemplate.count).keys()).map(index => {
    const schedule = actorTemplate.schedule.reduce((acc, scheduleTemplate) => {
      const entry = generateScheduleEntry(scheduleTemplate, station_names);
      if (Math.random() < entry.partOfScheduleProbability) {
        acc.push(entry);
      }
      return acc;
    }, []);
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
