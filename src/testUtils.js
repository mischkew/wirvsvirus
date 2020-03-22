export const testStations = {
  BHF_TEGEL: {
    name: 'Tegel',
    lat: 52.57,
    lng: 13.4,
    next_stops: ['BHF_FRIEDRICHSTRASSE'],
  },
  BHF_SUDKREUZ: {
    name: 'Sudkreuz',
    lat: 52.53,
    lng: 13.4,
    next_stops: ['BHF_FRIEDRICHSTRASSE'],
  },
  BHF_GRIEBNITZSEE: {
    name: 'Griebnitzsee',
    lat: 52.5,
    lng: 13.4,
    next_stops: ['BHF_CHARLOTTENBURG'],
  },
  BHF_FRIEDRICHSTRASSE: {
    name: 'Friedrichstrasse',
    lat: 52.51,
    lng: 13.4,
    next_stops: ['BHF_CHARLOTTENBURG', 'BHF_TEGEL', 'BHF_SUDKREUZ'],
  },
  BHF_CHARLOTTENBURG: {
    name: 'Charlottenburg',
    lat: 52.454,
    lng: 13.4,
    next_stops: ['BHF_FRIEDRICHSTRASSE', 'BHF_GRIEBNITZSEE'],
  },
};

export const testAgentsTemplate = {
  count: 100,
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
