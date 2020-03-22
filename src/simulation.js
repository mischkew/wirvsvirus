import PriorityQueue from 'js-priority-queue';
import { INFECTED } from './actorGeneration';

const logging = false;
export const WAITING = 0;
export const TRANSITIONING = 1;
export const TRAVEL_TIME = 100;
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

export class Simulator {
  constructor(stations, actors, paths) {
    this.stations = stations;
    this.actors = actors;
    this.paths = paths;
    this.time = 0;
    this.day = 0;
    this.travel_queue = new PriorityQueue({
      comparator: compareDateTime,
      strategy: PriorityQueue.BinaryHeapStrategy,
    });
    this.queue = new PriorityQueue({
      comparator: compareDateTime,
      strategy: PriorityQueue.BinaryHeapStrategy,
    });
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

    // advance the schedule to the next valid position
    // if at last entry, go back home (schedule 0)
    if (actor.current_schedule === actor.schedule.length - 1) {
      actor.current_schedule = 0;
    } else {
      actor.current_schedule += 1;
    }

    // skip any entries, which have a time in the past (cannot go there anymore)
    while (
      actor.schedule[actor.current_schedule].time < this.time &&
      actor.current_schedule !== 0
    ) {
      actor.current_schedule += 1;
      if (actor.current_schedule === actor.schedule.length - 1) {
        actor.current_schedule = 0;
      }
    }

    const destination = actor.schedule[actor.current_schedule].station;
    actor.path = this.paths[currentStation][destination];
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
    const queueItem = { actor, day: this.day + (time <= this.time), time };
    this.queue.queue(queueItem);

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

    while (
      this.queue.length > 0 &&
      this.queue.peek().day === this.day &&
      this.queue.peek().time <= this.time
    ) {
      const actor = this.queue.dequeue().actor;

      this.actorStayFinished(actor);
    }

    while (
      this.travel_queue.length > 0 &&
      this.travel_queue.peek().day === this.day &&
      this.travel_queue.peek().time <= this.time
    ) {
      const arrived_actors = this.travel_queue.dequeue().actors;
      arrived_actors.forEach(actor => {
        this.actorArrivedAtStation(actor);
      });
    }

    if (this.time % TRAVEL_TIME === 0) {
      Object.entries(this.station_queues).forEach(([station, nextStations]) => {
        Object.entries(nextStations).forEach(([next, actors]) => {
          if (actors.length > 0) {
            actors.forEach(actor => {
              actor.state = TRANSITIONING;
            });
            this.travel_queue.queue({
              day:
                this.day +
                Math.floor((this.time + TRAVEL_TIME) / MINUTES_PER_DAY),
              time: (this.time + TRAVEL_TIME) % MINUTES_PER_DAY,
              actors,
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
