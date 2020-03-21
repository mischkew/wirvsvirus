import {
  Simulator,
  TRAVEL_TIME,
  WAITING,
  TRANSITIONING,
  timeToMinutes,
} from './simulation';
import { testStations, testAgentsTemplate } from './testUtils';
import { HEALTHY, generateActors, generatePaths } from './actorGeneration';

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

  it('should do a full tour for an actor', () => {
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
