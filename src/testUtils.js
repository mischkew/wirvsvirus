export const testStations = {
  BHF_TEGEL: {
    name: 'Tegel',
    position: {
      x: 1,
      y: 1,
    },
    next_stops: ['BHF_FRIEDRICHSTRASSE'],
  },
  BHF_SUDKREUZ: {
    name: 'Sudkreuz',
    position: {
      x: 3,
      y: 2,
    },
    next_stops: ['BHF_FRIEDRICHSTRASSE'],
  },
  BHF_GRIEBNITZSEE: {
    name: 'Griebnitzsee',
    position: {
      x: 4,
      y: 1,
    },
    next_stops: ['BHF_CHARLOTTENBURG'],
  },
  BHF_FRIEDRICHSTRASSE: {
    name: 'Friedrichstrasse',
    position: {
      x: 2,
      y: 1,
    },
    next_stops: ['BHF_CHARLOTTENBURG', 'BHF_TEGEL', 'BHF_SUDKREUZ'],
  },
  BHF_CHARLOTTENBURG: {
    name: 'Charlottenburg',
    position: {
      x: 3,
      y: 1,
    },
    next_stops: ['BHF_FRIEDRICHSTRASSE', 'BHF_GRIEBNITZSEE'],
  },
};

export const testAgentsTemplate = {
  count: 1,
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
  ],
};
