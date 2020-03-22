import { generatePath, generatePaths } from './pathGeneration';
/* A - B - C
    |     /
    D - E
*/
const pathTestStations = {
  A: {
    next_stops: ['B', 'D'],
  },
  B: {
    next_stops: ['A', 'C'],
  },
  C: {
    next_stops: ['B', 'E'],
  },
  D: {
    next_stops: ['E', 'A'],
  },
  E: {
    next_stops: ['D', 'C'],
  },
};
describe('generatePath', () => {
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
    const hinweg = generatePath('A', 'C', pathTestStations);

    expect(hinweg).toEqual(['A', 'B', 'C']);

    const rueckweg = generatePath('C', 'A', pathTestStations);

    expect(rueckweg).toEqual(['C', 'B', 'A']);
  });
});

describe('generatePaths for actors', () => {
  it('generates all paths in the actors schedule', () => {
    const actors = [
      {
        schedule: [
          {
            station: 'A',
          },
          {
            station: 'C',
          },
          {
            station: 'D',
          },
        ],
      },
    ];

    const paths = generatePaths(pathTestStations);

    expect(paths['A']['C']).toEqual(['A', 'B', 'C']);
    expect(paths['C']['D']).toEqual(['C', 'E', 'D']);
    expect(paths['D']['A']).toEqual(['D', 'A']);
  });
});
