import json
from collections import deque


def connected_components(stations_dict):
    stations_dict = stations_dict["stations"]
    not_seen = {*stations_dict.keys()}
    components = []
    while not_seen:
        components.append([])
        first = not_seen.pop()
        seen = {first}
        queue = deque([first])
        while queue:
            current = queue.pop()
            if current in not_seen:
                not_seen.remove(current)
            components[-1].append(current)
            for s in stations_dict[current]["next_stops"]:
                if s not in seen:
                    queue.append(s)
                    seen.add(s)
    return components


def take_largest_component(stations_dict):
    components = connected_components(stations_dict)
    largest_component = set(sorted(components, key=len)[-1])
    stations_dict = stations_dict["stations"]
    stations = {k: v for k, v in stations_dict.items() if k in largest_component}
    return {"stations": stations}


if __name__ == "__main__":
    with open("stations.json", "r") as f:
        d = json.load(f)
        c = connected_components(d)
        for comp in c:
            print(len(comp))
        print(c)
