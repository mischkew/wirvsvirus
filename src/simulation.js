import PriorityQueue from 'js-priority-queue';

export const WAITING = 0;
export const TRANSITIONING = 1;
export const TRAVEL_TIME = 10;

export const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(time) {
  return Math.floor(time / 100) * 60 + (time % 100);
}

export class Simulator {
  constructor(stations, actors, paths) {
    this.stations = stations;
    this.actors = actors;
    this.paths = paths;
    this.time = 0;
    this.day = 0;
    this.travel_queue = new PriorityQueue({
      comparator: (a, b) => {
        return a.time < b.time;
      },
      strategy: PriorityQueue.BinaryHeapStrategy,
    });
    this.queue = new PriorityQueue({
      comparator: (a, b) => {
        return a.day < b.day || (a.day === b.day && a.time < b.time);
      },
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
    if (actor.current_schedule === actor.schedule.length - 1) {
      actor.current_schedule = 0;
    } else {
      actor.current_schedule += 1;
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
  }

  actorScheduleWait(actor) {
    const entry = actor.schedule[actor.current_schedule];

    // manage infection due to stay
    const time = timeToMinutes(entry.stay_until);

    this.queue.queue({ actor, day: this.day + (time < this.time), time });
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
  }

  handleInfectionTrigger(actors) {}

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