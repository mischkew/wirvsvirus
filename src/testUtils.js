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
  schedule: [
    {
      name: 'residence',
      // how likely is it that an actor will go here on a day?
      // sampled once per day
      dailyProbability: {
        value: 1,
        variance: 0,
      },
      // how likely is it that this location is part of
      // an actors schedule?
      // sampled when creating the actor
      partOfScheduleProbability: 1,
      stay_until: {
        time: 800,
        variance: 300,
      },
    },
    {
      name: 'work',
      dailyProbability: {
        value: 1,
        variance: 0,
      },
      partOfScheduleProbability: 1,
      stay_until: {
        time: 1500,
        variance: 300,
      },
    },
    {
      name: 'groceries',
      dailyProbability: {
        value: 0.2,
        variance: 0,
      },
      partOfScheduleProbability: 1,
      stay_until: {
        time: 1900,
        variance: 200,
      },
    },
    {
      name: 'evening',
      dailyProbability: {
        value: 0.5,
        variance: 0,
      },
      partOfScheduleProbability: 1,
      stay_until: {
        time: 2200,
        variance: 150,
      },
    },
    {
      name: 'night',
      dailyProbability: {
        value: 0.5,
        variance: 0,
      },
      partOfScheduleProbability: 0.1,
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
  schedule: [
    {
      name: 'residence',
      dailyProbability: {
        value: 1,
        variance: 0,
      },
      partOfScheduleProbability: 1,
      stay_until: {
        time: 800,
        variance: 300,
      },
    },
    {
      name: 'work',
      dailyProbability: {
        value: 0.25,
        variance: 0,
      },
      partOfScheduleProbability: 1,
      stay_until: {
        time: 1500,
        variance: 300,
      },
    },
    {
      name: 'groceries',
      dailyProbability: {
        value: 0.3,
        variance: 0,
      },
      partOfScheduleProbability: 1,
      stay_until: {
        time: 1900,
        variance: 200,
      },
    },
  ],
};
