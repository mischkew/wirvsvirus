import PriorityQueue from 'js-priority-queue';
import { generatePathFromPredecessorMap } from './pathGeneration';
import { INFECTED } from './actorGeneration';

const logging = false;
export const WAITING = 0;
export const TRANSITIONING = 1;
export const TRAVEL_TIME = 10;
export const INFECTION_SPEED = 0.1;

export const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(time) {
  return Math.floor(time / 100) * 60 + (time % 100);
}

function compareDateTime(a, b) {
  if (a.day < b.day) {
    return -1;
  }

  if (a.day > b.day) {
    return 1;
  }

  return a.time - b.time;
}

class TimeQueue {
  constructor() {
    this.queue = this.travel_queue = new PriorityQueue({
      comparator: compareDateTime,
      strategy: PriorityQueue.BinaryHeapStrategy,
    });
  }

  enqueue({ item, day, time }) {
    this.queue.queue({ item, day, time });
  }

  dequeueExpired(day, time, callback) {
    while (
      this.queue.length > 0 &&
      this.queue.peek().day === day &&
      this.queue.peek().time <= time
    ) {
      const item = this.queue.dequeue().item;

      callback(item);
    }
  }
}

export class Actor {
  constructor({
    status,
    schedule,
    current_station,
    current_schedule,
    state,
    path,
    path_position,
  }) {
    this.status = status;
    this.schedule = schedule;
    this.current_station = current_station;
    this.current_schedule = current_schedule;
    this.state = state;
    this.path = path;
    this.path_position = path_position;
  }

  advanceSchedule({ time }) {
    // advance the schedule to the next valid position
    // if at last entry, go back home (schedule 0)
    if (this.current_schedule === this.schedule.length - 1) {
      this.current_schedule = 0;
    } else {
      this.current_schedule += 1;
    }

    // skip any entries, which have a time in the past (cannot go there anymore)
    while (
      this.schedule[this.current_schedule].time < time &&
      this.current_schedule !== 0
    ) {
      this.current_schedule += 1;
      if (this.current_schedule === this.schedule.length - 1) {
        this.current_schedule = 0;
      }
    }
  }
}

function buildActors(actorsData) {
  return actorsData.map(actorData => {
    return new Actor(actorData);
  });
}

export class Simulator {
  constructor(stations, actorsData, predecessorMaps) {
    this.stations = stations;
    this.actors = buildActors(actorsData);
    this.predecessorMaps = predecessorMaps;
    this.time = 0;
    this.day = 0;
    this.travel_queue = new TimeQueue();
    this.idle_queue = new TimeQueue();
    this.station_queues = Object.fromEntries(
      Object.entries(stations).map(([key, station]) => {
        const next_stops = Object.fromEntries(
          station.next_stops.map(station => {
            return [station, []];
          })
        );
        return [key, next_stops];
      })
    );

    this.arrivalCallback = null;
    this.finishStayCallback = null;
    this.waitCallback = null;
  }

  startActors() {
    this.actors.forEach(actor => {
      this.actorScheduleWait(actor);
    });
  }

  onNextDay() {
    this.day += 1;
  }

  stepTime() {
    this.time = this.time + 1;
    if (this.time === MINUTES_PER_DAY) {
      this.time = 0;
      this.onNextDay();
    }
  }

  actorStayFinished(actor) {
    // stay_until has expired, go to next entry in the schedule
    const currentStation = actor.schedule[actor.current_schedule].station;

    actor.advanceSchedule({ time: this.time });

    const destination = actor.schedule[actor.current_schedule].station;
    actor.path = generatePathFromPredecessorMap(
      this.predecessorMaps[currentStation],
      destination
    );
    actor.path_position = 0;

    if (actor.path.length === 1) {
      actor.path = null;
      actor.path_position = null;
      this.actorScheduleWait(actor);
    } else {
      const nextStation = actor.path[actor.path_position + 1];
      this.station_queues[currentStation][nextStation].push(actor);
    }

    if (this.finishStayCallback !== null) {
      this.finishStayCallback(
        actor,
        currentStation,
        destination,
        actor.schedule[actor.current_schedule].name
      );
    }
  }

  actorScheduleWait(actor) {
    const entry = actor.schedule[actor.current_schedule];

    // TODO manage infection due to stay

    const time = timeToMinutes(entry.stay_until);
    const queueItem = {
      item: actor,
      day: this.day + (time <= this.time),
      time,
    };
    this.idle_queue.enqueue(queueItem);

    if (this.waitCallback !== null) {
      this.waitCallback(actor, queueItem.day, queueItem.time);
    }
  }

  actorArrivedAtStation(actor) {
    actor.path_position += 1;
    actor.current_station = actor.path[actor.path_position];
    actor.state = WAITING;

    if (actor.path_position === actor.path.length - 1) {
      // actor arrived at destination
      actor.path = null;
      actor.path_position = null;
      this.actorScheduleWait(actor);
    } else {
      // go to next station in path
      const currentStation = actor.path[actor.path_position];
      const nextStation = actor.path[actor.path_position + 1];
      this.station_queues[currentStation][nextStation].push(actor);
    }

    if (this.arrivalCallback !== null) {
      this.arrivalCallback(actor);
    }
  }

  handleInfectionTrigger(actors) {
    const infected = actors.reduce((acc, actor) => {
      return acc + (actor.status === INFECTED ? 1 : 0);
    }, 0);

    let infection_chance = (infected / actors.length) * INFECTION_SPEED;
    if (infection_chance > 1) {
      infection_chance = 1;
    }

    if (logging && infection_chance > 0) {
      console.log(
        `Spreading the infection on ${actors.length} people with chance ${infection_chance}`
      );
    }

    actors.forEach(actor => {
      if (infection_chance > Math.random()) {
        actor.status = INFECTED;
      }
    });
  }

  step() {
    this.stepTime();

    this.idle_queue.dequeueExpired(this.day, this.time, actor => {
      this.actorStayFinished(actor);
    });

    this.travel_queue.dequeueExpired(this.day, this.time, arrivedActors => {
      arrivedActors.forEach(actor => {
        this.actorArrivedAtStation(actor);
      });
    });

    if (this.time % TRAVEL_TIME === 0) {
      Object.entries(this.station_queues).forEach(([station, nextStations]) => {
        Object.entries(nextStations).forEach(([next, actors]) => {
          if (actors.length > 0) {
            actors.forEach(actor => {
              actor.state = TRANSITIONING;
            });
            this.travel_queue.enqueue({
              day:
                this.day +
                Math.floor((this.time + TRAVEL_TIME) / MINUTES_PER_DAY),
              time: (this.time + TRAVEL_TIME) % MINUTES_PER_DAY,
              item: actors,
            });
            this.handleInfectionTrigger(actors);
            nextStations[next] = [];
          }
        });
      });
    }

    return this.actors;
  }
}
