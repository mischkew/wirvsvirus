import json

import osmnx as ox
from sklearn.neighbors import KDTree


def get_central_node(graph, lat, long):
    """given a geocoded loction and a graph return
        find the node closests to the location """
    graph_df, _ = ox.graph_to_gdfs(graph)
    graph_tree = KDTree(graph_df[["y", "x"]], metric="euclidean")
    adress_idx = graph_tree.query([(lat, long)], k=1, return_distance=False)[0]
    closest_node = graph_df.iloc[adress_idx].index.values[0]
    return closest_node


def open_json(file_path):
    with open(file_path) as file:
        data_dict = json.loads(file.read())
    return data_dict


def get_neighbourhood(graph):
    """extract the lat long locations"""
    lats = [float(y) for _, y in graph.nodes(data="y")]
    lngs = [float(x) for _, x in graph.nodes(data="x")]
    return zip(lats, lngs)


def process_graph(graph, data_dict):
    """process a single graph, getting all adjacent nodes and
    and add them to a the dictionary mapping the stations"""

    #     getting all information from the graph object
    zipper = get_neighbourhood(graph)
    nodes = list(graph.nodes)
    lat_n_longs = list(zipper)

    #     mapping adjacent streets
    adj_list = list(graph.adjacency())
    for i, node in enumerate(nodes):
        data_dict["stations"][str(node)] = {}
        data_dict["stations"][str(node)]["type"] = "street"
        data_dict["stations"][str(node)]["lat"] = lat_n_longs[i][0]
        data_dict["stations"][str(node)]["lng"] = lat_n_longs[i][1]
        next_stops = list(adj_list[i][1].keys())
        data_dict["stations"][str(node)]["next_stops"] = next_stops


def process_stations(data_dict, distance=100):
    """processing all stations from the input file"""
    #     opening the json and converting to dict
    temp_dict = {"stations": {}}
    for key in data_dict["stations"].keys():
        # creating the graph and finding the closes node to the station and
        # appending it

        lat = data_dict["stations"][key]["lat"]
        long = data_dict["stations"][key]["lng"]
        graph = ox.core.graph_from_point((lat, long), distance=distance)
        central_node = get_central_node(graph, lat, long)
        data_dict["stations"][key]["next_stops"].append(central_node)

        process_graph(graph, temp_dict)
        temp_dict["stations"][str(central_node)]["next_stops"].append(key)

    data_dict["stations"].update(temp_dict["stations"])
    return data_dict


if __name__ == "__main__":
    data_dict = open_json("stations.json")
    process_stations(data_dict,)
    with open("stations_and_streets.json", "w") as file:
        json.dump(data_dict, file, default=str)
