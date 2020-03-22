import PriorityQueue from 'js-priority-queue';
import { generatePathFromPredecessorMap } from './pathGeneration';
import { INFECTED } from './actorGeneration';

const logging = false;
export const WAITING = 0;
export const TRANSITIONING = 1;
export const TRAVEL_TIME = 10;
export const INFECTION_SPEED = 0.5;

export const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(time) {
  return Math.floor(time / 100) * 60 + (time % 100);
}

export function minutesToTime(min) {
  return Math.floor(min / 60) * 100 + (min % 60);
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
    sim,
  }) {
    this.status = status;
    this.schedule = schedule;
    this.current_station = current_station;
    this.current_schedule = current_schedule;
    this.state = state;
    this.path = path;
    this.path_position = path_position;
    this.sim = sim;
  }

  arriveAtNextPathStop() {
    this.state = WAITING;

    this.advancePath({
      onNext: () => {
        this.sim.actorWaitsForDeparture({
          actor: this,
          station: this.current_station,
          destination: this.nextPathStop(),
        });
      },
      onArrivedAtDestination: () => {
        this.arriveAtScheduleLocation();
      },
    });
  }

  arriveAtScheduleLocation() {
    if (this.currentScheduleExpired()) {
      this.advanceSchedule();
    }
    this.sim.scheduleWait(
      this,
      this.schedule[this.current_schedule].stay_until
    );
  }

  currentScheduleExpired() {
    // check if the current schedule entry's stay_until is in the past
    // the first entry (residence) can never expire
    // meaning the actor will always wait at home if nothing else is left on the schedule
    return (
      this.current_schedule !== 0 &&
      this.schedule[this.current_schedule].time < this.sim.time
    );
  }

  stayFinished() {
    this.advanceSchedule();

    this.preparePath({
      onAlreadyThere: () => {
        this.arriveAtScheduleLocation();
      },
      onPrepared: () => {
        this.sim.actorWaitsForDeparture({
          actor: this,
          station: this.current_station,
          destination: this.nextPathStop(),
        });
      },
    });
  }

  _cycleSchedule() {
    if (this.current_schedule === this.schedule.length - 1) {
      this.current_schedule = 0;
    } else {
      this.current_schedule += 1;
    }
  }

  advanceSchedule() {
    // advance the schedule to the next valid position
    // if at last entry, go back home (schedule 0)
    this._cycleSchedule();

    // skip any entries, which have a time in the past (cannot go there anymore)
    while (this.currentScheduleExpired()) {
      this._cycleSchedule();
    }

    this.maybeSkipSchedule();
  }

  maybeSkipSchedule() {
    if (Math.random() > this.schedule[this.current_schedule].probability) {
      this._cycleSchedule();
    }
  }

  advancePath({ onNext, onArrivedAtDestination }) {
    this.path_position += 1;
    this.current_station = this.path[this.path_position];

    if (this.path_position === this.path.length - 1) {
      // arrived at destination
      this.path = null;
      this.path_position = null;
      onArrivedAtDestination();
    } else {
      // go to next station in path
      onNext();
    }
  }

  preparePath({ onAlreadyThere, onPrepared }) {
    const destination = this.schedule[this.current_schedule].station;
    if (destination === this.current_station) {
      onAlreadyThere();
      return;
    }
    this.path = generatePathFromPredecessorMap(
      this.sim.predecessorMaps[this.current_station],
      destination
    );
    this.path_position = 0;
    onPrepared();
  }

  nextPathStop() {
    if (this.path === null || this.path_position === this.path.length - 1) {
      return null;
    }
    return this.path[this.path_position + 1];
  }
}

function buildActors(actorsData, sim) {
  return actorsData.map(actorData => {
    return new Actor({ ...actorData, sim });
  });
}

export class Simulator {
  constructor(stations, actorsData, predecessorMaps) {
    this.stations = stations;
    this.actors = buildActors(actorsData, this);
    this.predecessorMaps = predecessorMaps;
    this.time = 6 * 60;
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

    this.arrivalCallback = () => {};
    this.finishStayCallback = () => {};
    this.waitCallback = () => {};
  }

  startActors() {
    this.actors.forEach(actor => {
      actor.arriveAtScheduleLocation();
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

  actorWaitsForDeparture({ actor, station, destination }) {
    this.station_queues[station][destination].push(actor);
  }

  scheduleWait(actor, until) {
    const time = timeToMinutes(until);
    const queueItem = {
      item: actor,
      day: this.day + (time <= this.time),
      time,
    };
    this.idle_queue.enqueue(queueItem);

    this.waitCallback(actor, queueItem.day, queueItem.time);
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
      actor.stayFinished();
      this.finishStayCallback(
        actor,
        actor.current_station,
        actor.nextPathStop(),
        actor.schedule[actor.current_schedule].name
      );
    });

    this.travel_queue.dequeueExpired(this.day, this.time, arrivedActors => {
      arrivedActors.forEach(actor => {
        actor.arriveAtNextPathStop();
        this.arrivalCallback(actor);
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
