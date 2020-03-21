import React from 'react';
import SimulationMap from './components/SimulationMap';
import './App.css';

function App() {
  return (
    <div className="App">
      <SimulationMap
        position={{ lat: 52.52885, lng: 13.40456 }}
        box={{
          topLeft: { lat: 52.6, lng: 13.1 },
          bottomRight: { lat: 52.4, lng: 13.7 },
        }}
      />
    </div>
  );
}

export default App;
