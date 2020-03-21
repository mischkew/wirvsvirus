import {
  Simulator,
  TRAVEL_TIME,
  WAITING,
  TRANSITIONING,
  timeToMinutes,
  MINUTES_PER_DAY,
} from './simulation';
import { testStations, testAgentsTemplate } from './testUtils';
import {
  HEALTHY,
  INFECTED,
  generateActors,
  generatePaths,
} from './actorGeneration';

import berlinStationData from './assets/stations.json';

function next(sim) {
  sim.time += TRAVEL_TIME - 1;
  sim.step();
}

function buildActors() {
  return [
    {
      status: HEALTHY,
      schedule: [
        {
          station: 'BHF_TEGEL',
          name: 'residence',
          probability: 1,
          stay_until: 900,
        },
        {
          station: 'BHF_GRIEBNITZSEE',
          name: 'work',
          probability: 1,
          stay_until: 1700,
        },
        {
          station: 'BHF_SUDKREUZ',
          name: 'leisure',
          probability: 1,
          stay_until: 2100,
        },
      ],
      current_station: 'BHF_TEGEL',
      current_schedule: 0,
      state: WAITING,
      path: null,
      path_position: null,
    },
  ];
}
let actors = buildActors();
const paths = generatePaths(actors, testStations);

describe('Simulator', () => {
  beforeEach(() => {
    actors = buildActors();
  });

  it('should construct', () => {
    let sim = new Simulator(testStations, actors, paths);
  });

  it('should start actors', () => {
    let sim = new Simulator(testStations, actors, paths);
    sim.startActors();
  });

  it('should simulate a step', () => {
    let sim = new Simulator(testStations, actors, paths);
    sim.startActors();
    sim.step();
  });

  it('should finish an actors stay', () => {
    const actor = actors[0];
    let sim = new Simulator(testStations, actors, paths);
    sim.startActors();
    sim.time = timeToMinutes(859);
    sim.step();

    expect(actor.current_schedule).toBe(1);
    expect(actor.state).toBe(TRANSITIONING);
  });

  it('should make an actor travel', () => {
    const actor = actors[0];
    let sim = new Simulator(testStations, actors, paths);
    sim.startActors();
    sim.time = timeToMinutes(859);
    sim.step();

    expect(actor.path_position).toBe(0);

    next(sim);

    expect(actor.path_position).toBe(1);
  });

  it('should make an actor arrive', () => {
    const actor = actors[0];
    let sim = new Simulator(testStations, actors, paths);
    sim.startActors();
    sim.time = timeToMinutes(859);
    sim.step();
    next(sim);
    expect(actor.path_position).toBe(1);
    next(sim);
    expect(actor.path_position).toBe(2);
    next(sim);

    expect(actor.path_position);
    expect(actor.path).toBe(null);
  });

  it('should do a full tour for all actors', () => {
    const actor = actors[0];
    let sim = new Simulator(testStations, actors, paths);
    sim.startActors();
    sim.time = timeToMinutes(859);
    sim.step();
    next(sim);
    next(sim);
    next(sim);

    expect(actor.current_station).toBe('BHF_GRIEBNITZSEE');

    sim.time = timeToMinutes(1659);
    sim.step();
    next(sim);
    next(sim);
    next(sim);

    expect(actor.current_station).toBe('BHF_SUDKREUZ');
    sim.time = timeToMinutes(2059);
    sim.step();
    next(sim);
    next(sim);

    expect(actor.current_station).toBe('BHF_TEGEL');
  });
});

function minutesToTime(min) {
  return Math.floor(min / 60) * 100 + (min % 60);
}

describe('CLI Simulation', () => {
  function simulate(stations, actors, paths) {
    actors[0].status = INFECTED;

    // actors.forEach(actor => {
    //   console.log(`Actor ${actor.name} starts at ${actor.current_station}`);
    //   console.log(actor.schedule);
    // });

    let sim = new Simulator(testStations, actors, paths);

    function onArrival(actor) {
      console.log(
        `${minutesToTime(sim.time)}: Actor ${actor.name} arrived at ${
          actor.current_station
        }`
      );
    }

    function onLeave(actor, station, destination, name) {
      console.log(
        `${minutesToTime(sim.time)}: Actor ${
          actor.name
        } leaves ${station}, travels to ${destination}, purpose ${name}`
      );
    }

    function onWait(actor, day, time) {
      console.log(
        `${minutesToTime(sim.time)}: Actor ${actor.name} waits at ${
          actor.current_station
        } until Day ${day}, Hours ${minutesToTime(time)}`
      );
    }

    // sim.finishStayCallback = onLeave;
    // sim.arrivalCallback = onArrival;
    // sim.waitCallback = onWait;
    sim.startActors();

    const startTime = Date.now();
    const sim_days = 1;
    for (let day = 0; day < sim_days; ++day) {
      // console.log(`Day ${day}`);
      // console.log(`Sim: ${sim.day} ${sim.time}`);
      for (let minute = 0; minute < MINUTES_PER_DAY; ++minute) {
        if (minute === timeToMinutes(2002)) {
          let dummy;
        }
        sim.step();
      }
    }
    const endTime = Date.now();
    console.log(endTime - startTime);

    const infected = actors.reduce((acc, actor) => {
      return acc + (actor.status === INFECTED ? 1 : 0);
    }, 0);

    console.log(
      `${infected} of ${actors.length} people are infected after ${sim_days} days.`
    );
  }

  it('runs with example data', () => {
    let actors = generateActors(testAgentsTemplate, testStations).map(
      (actor, index) => {
        actor.name = index;
        return actor;
      }
    );

    const paths = generatePaths(actors, testStations);

    simulate(testStations, actors, paths);
  });

  it('runs with real data', () => {
    const berlinStations = berlinStationData['stations'];
    let actors = generateActors(testAgentsTemplate, berlinStations);
    const paths = generatePaths(actors, berlinStations);

    // simulate(berlinStations, actors, paths);
  });
});
