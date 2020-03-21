import { MapLayer, withLeaflet } from 'react-leaflet';
import _AgentsLayer from '../layers/agents';

class AgentsLayer extends MapLayer {
  createLeafletElement({ stations, simulationOptions }) {
    return new _AgentsLayer(stations, { simulation: simulationOptions });
  }

  updateLeafletElement(fromProps, toProps) {
    if (fromProps.stations !== toProps.stations) {
      this.leafletElement.updateStations(toProps.stations);
    }

    if (fromProps.simulationOptions !== toProps.simulationOptions) {
      this.leafletElement.updateOptions(toProps.simulationOptions);
    }
  }
}

export default withLeaflet(AgentsLayer);
