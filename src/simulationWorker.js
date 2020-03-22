import { generatePaths, generateActors } from './actorGeneration';
import { Simulator, WAITING } from './simulation';
import { HEALTHY } from './actorGeneration';

let actors = null;
let allPaths = null;
let simulator = null;
let stationPositions = null;

// if true, the simulation loop keeps running in the thread
let isRunning = false;

export function setupSimulation(simulationOptions, stations) {
  if (
    actors !== null ||
    allPaths !== null ||
    simulator !== null ||
    stationPositions !== null
  ) {
    throw new Error(
      'Simulation already setup. Destroy simulation first via `destroySimulation`.'
    );
  }

  actors = generateActors(simulationOptions, stations);
  allPaths = generatePaths(actors, stations);
  simulator = new Simulator(stations, actors, allPaths);
  simulator.startActors();

  stationPositions = new Map(
    Object.entries(stations).map(([id, station]) => [
      id,
      [station.lat, station.lng],
    ])
  );
}

/**
 * Encode the agent objects into low-level datastructures which can easily be
 * passed as messages and also passed as attributes to the shader engine.
 * @param {Array} agents List of agent objects
 * @returns {string} Stringified payload
 */
function encodeAgents(agents) {
  function encodeAgent(agent) {
    // In order to render a single agent we need:
    // - it's current start path and target path
    // - it's current transitioning status
    // - it's current infection status
    //
    // We compute coordinates as tuples to be able to pass them to `regl`
    // directly

    // TODO: use path positions!
    const index =
      agent.current_schedule + 1 === agent.schedule.length
        ? 0
        : agent.current_schedule + 1;
    const currentStation = agent.schedule[agent.current_schedule].station;
    const nextStation = agent.schedule[index].station;

    return [
      stationPositions.get(currentStation),
      stationPositions.get(nextStation),
      agent.state === WAITING ? 1.0 : 0.0,
      HEALTHY,
    ];
  }

  const encodedAgents = agents.map(encodeAgent);
  return [simulator.day, simulator.time, encodedAgents];
}

export function runSimulation(updateInterval) {
  // Force the render to render at every `updateInterval` ticks. This will
  // update the message-listener with the new agents every `updateInterval`
  // ticks.
  if (updateInterval === undefined) {
    updateInterval = 1;
  }

  if (isRunning) {
    throw new Error(
      'Simulation is already running. Destroy simulation first via `destroySimulation`'
    );
  }

  isRunning = true;
  let ticks = 0;

  function loop() {
    if (isRunning) {
      requestAnimationFrame(loop);
    }

    // console.time('sim');
    const agents = simulator.step();
    // console.timeEnd('sim');

    ticks++;

    if (ticks >= updateInterval) {
      ticks = 0;
      // console.time('encode');
      const e = encodeAgents(agents);
      // console.timeEnd('encode');
      // console.time('post');
      postMessage(e);
      // console.timeEnd('post');
    }
  }

  loop();
}

export function destroySimulation() {
  isRunning = false;
  actors = null;
  allPaths = null;
  simulator = null;
  stationPositions = null;
}
