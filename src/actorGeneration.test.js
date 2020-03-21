import {
  generateScheduleEntry,
  generateActors,
  sampleRange,
  generatePath,
} from './actorGeneration';
describe('sampleRange', () => {
  it('produces numbers', () => {
    const output = sampleRange(100, 10);
    expect(output).toBeLessThan(110);
    expect(output).toBeGreaterThanOrEqual(90);
  });
});
describe('generateStation', () => {
  it('generates a station according to a template', () => {
    const template = {
      name: 'leisure',
      probability: {
        value: 0.5,
        variance: 0.1,
      },
      stay_until: {
        time: 2100,
        variance: 100,
      },
    };

    const stations = ['BHF_A', 'BHF_B'];

    const expectedEntry = {
      station: 'BHF_A',
      name: 'leisure',
      probability: 0.5,
      stay_until: 2100,
    };

    const entry = generateScheduleEntry(template, stations);

    expect(stations).toContain(entry.station);
    expect(entry.name).toBe(expectedEntry.name);
    expect(entry.probability).toBeLessThan(
      template.probability.value + template.probability.variance
    );
    expect(entry.probability).toBeGreaterThan(
      template.probability.value - template.probability.variance
    );
  });
});

describe('generateActors', () => {
  const stations = {
    BHF_A: {
      position: {
        x: 1,
        y: 1,
      },
    },
    BHF_B: {
      position: {
        x: 2,
        y: 2,
      },
    },
  };

  const agentsTemplate = {
    count: 5,
    recovery_time: 10,
    infection_probability: 0.2,
    schedule: [
      {
        name: 'residence',
        probability: {
          value: 1,
          variance: 0,
        },
        stay_until: {
          time: 800,
          variance: 100,
        },
      },
      {
        name: 'work',
        probability: {
          value: 1,
          variance: 0,
        },
        stay_until: {
          time: 1700,
          variance: 100,
        },
      },
      {
        name: 'leisure',
        probability: {
          value: 0.3,
          variance: 0.1,
        },
        stay_until: {
          time: 2100,
          variance: 100,
        },
      },
      {
        name: 'shopping',
        probability: {
          value: 0.2,
          variance: 0.1,
        },
        stay_until: {
          time: 1900,
          variance: 30,
        },
      },
    ],
  };

  const actors = generateActors(agentsTemplate, stations);

  //console.log(JSON.stringify(actors, null, 2));
});

describe('generatePaths', () => {
  it('handles straight lines', () => {
    const stations = {
      A: {
        next_stops: ['B'],
      },
      B: {
        next_stops: ['A', 'C'],
      },
      C: {
        next_stops: ['B'],
      },
    };

    const hinweg = generatePath('A', 'C', stations);

    expect(hinweg).toEqual(['A', 'B', 'C']);

    const rueckweg = generatePath('C', 'A', stations);

    expect(rueckweg).toEqual(['C', 'B', 'A']);
  });

  it('finds the shortest path', () => {
    /* A - B - C
       |     /
       D - E
    */
    const stations = {
      A: {
        next_stops: ['B', 'D'],
      },
      B: {
        next_stops: ['A', 'C'],
      },
      C: {
        next_stops: ['B'],
      },
      D: {
        next_stops: ['E', 'A'],
      },
      E: {
        next_stops: ['D', 'C'],
      },
    };

    const hinweg = generatePath('A', 'C', stations);

    expect(hinweg).toEqual(['A', 'B', 'C']);

    const rueckweg = generatePath('C', 'A', stations);

    expect(rueckweg).toEqual(['C', 'B', 'A']);
  });
});
