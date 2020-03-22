import React from 'react';
import SimulationMap from './components/SimulationMap';
import L from 'leaflet';
import './App.css';
// import { stations } from './assets/stations.json';
import { testAgentsTemplate, testStations } from './testUtils';

const berlinCenter = L.latLng(52.52885, 13.40456);
const berlincBox = L.latLngBounds(L.latLng(52.4, 13.1), L.latLng(52.6, 13.7));

function App() {
  return (
    <div className="App">
      <SimulationMap
        maxZoom={20}
        position={berlinCenter}
        box={berlincBox}
        stations={testStations}
        simulationOptions={testAgentsTemplate}
      />
    </div>
  );
}

export default App;
