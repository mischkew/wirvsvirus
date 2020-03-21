import React from 'react';
import SimulationMap from './components/SimulationMap';
import L from 'leaflet';
import './App.css';
import { stations } from './assets/stations.json';

const berlinCenter = L.latLng(52.52885, 13.40456);
const berlincBox = L.latLngBounds(L.latLng(52.4, 13.1), L.latLng(52.6, 13.7));

function App() {
  return (
    <div className="App">
      <SimulationMap
        position={berlinCenter}
        box={berlincBox}
        stations={stations}
      />
    </div>
  );
}

export default App;
