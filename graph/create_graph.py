import json

from subway_graph import create_subway_graph
from connected_components import take_largest_component

# from street_graph import process_stations


def check_graph(stations):
    next_stations = []
    for station in stations.values():
        next_stations.extend(station["next_stops"])
    print(set(next_stations), set(stations))
    assert set(next_stations) == set(stations)


def create_complete_graph():
    g = create_subway_graph()
    # g = process_stations(g)
    g = take_largest_component(g)
    check_graph(g["stations"])
    return g


if __name__ == "__main__":
    g = create_complete_graph()
    with open("stations.json", "w") as f:
        json.dump(g, f, indent=4)
