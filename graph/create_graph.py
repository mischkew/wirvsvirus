import json

from subway_graph import create_subway_graph
from connected_components import take_largest_component
from street_graph import process_stations


BBOX = (52.4, 13.1, 52.6, 13.7)


def in_bbox(station):
    lat = station["lat"]
    lng = station["lng"]
    return lat > BBOX[0] and lat < BBOX[2] and lng > BBOX[1] and lng < BBOX[3]


def check_bbox(stations):
    stations = {k: v for k, v in stations.items() if in_bbox(v)}
    station_keys = set(stations)
    for k, v in stations.items():
        v["next_stops"] = [s for s in v["next_stops"] if s in station_keys]
    return stations


def ensure_birected(stations):
    for k, v in stations.items():
        for next_stop in v["next_stops"]:
            if k not in stations[next_stop]["next_stops"]:
                stations[next_stop]["next_stops"].append(k)


def clean_graph(stations):
    station_keys = set(stations)
    for station in stations.values():
        next_stops = [s for s in station["next_stops"] if s in station_keys]
        station["next_stops"] = next_stops
    next_stations = []
    for station in stations.values():
        next_stations.extend(station["next_stops"])
    next_stations = set(next_stations)
    return {k: v for k, v in stations.items() if k in next_stations}


def check_graph(stations):
    next_stations = []
    for station in stations.values():
        next_stations.extend(station["next_stops"])
    assert set(next_stations) == set(stations)


def create_complete_graph(with_streets=True):
    g = create_subway_graph()
    g = take_largest_component(g)
    g = {"stations": check_bbox(g["stations"])}
    if with_streets:
        g = process_stations(g)
        g = {"stations": check_bbox(g["stations"])}
        g = take_largest_component(g)
    ensure_birected(g["stations"])
    g = {"stations": clean_graph(g["stations"])}
    check_graph(g["stations"])
    return g


if __name__ == "__main__":
    g = create_complete_graph()
    with open("stations.json", "w") as f:
        json.dump(g, f, indent=4)
