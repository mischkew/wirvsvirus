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
    lng: 13.43,
    next_stops: ['BHF_CHARLOTTENBURG'],
  },
  BHF_FRIEDRICHSTRASSE: {
    name: 'Friedrichstrasse',
    lat: 52.51,
    lng: 13.39,
    next_stops: ['BHF_CHARLOTTENBURG', 'BHF_TEGEL', 'BHF_SUDKREUZ'],
  },
  BHF_CHARLOTTENBURG: {
    name: 'Charlottenburg',
    lat: 52.454,
    lng: 13.45,
    next_stops: ['BHF_FRIEDRICHSTRASSE', 'BHF_GRIEBNITZSEE'],
  },
};

export const testAgentsTemplate = {
  count: 1000,
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
        variance: 300,
      },
    },
    {
      name: 'work',
      probability: {
        value: 1,
        variance: 0,
      },
      stay_until: {
        time: 1500,
        variance: 300,
      },
    },
    {
      name: 'groceries',
      probability: {
        value: 0.3,
        variance: 0,
      },
      stay_until: {
        time: 1900,
        variance: 200,
      },
    },
    {
      name: 'evening',
      probability: {
        value: 0.1,
        variance: 0,
      },
      stay_until: {
        time: 2200,
        variance: 150,
      },
    },
    {
      name: 'night',
      probability: {
        value: 0.05,
        variance: 0,
      },
      stay_until: {
        time: 200,
        variance: 100,
      },
    },
  ],
};

// no evening / nighttime activities
// 25% of people work
export const quarantineTemplate = {
  count: 1000,
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
        variance: 300,
      },
    },
    {
      name: 'work',
      probability: {
        value: 0.25,
        variance: 0,
      },
      stay_until: {
        time: 1500,
        variance: 300,
      },
    },
    {
      name: 'groceries',
      probability: {
        value: 0.3,
        variance: 0,
      },
      stay_until: {
        time: 1900,
        variance: 200,
      },
    },
  ],
};
