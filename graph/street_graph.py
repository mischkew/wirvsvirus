import json

import osmnx as ox
from sklearn.neighbors import KDTree
import numpy as np


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


def prune_nodes(central_node, nodes, adj_list, lat_n_longs, n_paths=2,
                max_hops=3):
    start = central_node
    nodes_on_paths = []

    for i in range(n_paths):
        current_paths = []
        hop = 0
        current_node = start
        start_index = nodes.index(start)

        if list(adj_list[start_index][1].keys()):
            while hop <= max_hops:
                node_index = nodes.index(current_node)
                current_paths.append(current_node)
                if len(adj_list[node_index][1].keys()) == 0:
                    break
                else:
                    next_node = np.random.choice(list(adj_list[node_index][1].keys()))
                    current_node = next_node
                    hop = hop + 1
        else:
            current_paths = [central_node]
        nodes_on_paths.append(current_paths)

    set_path = set(inner for outer in nodes_on_paths for inner in outer)

    nodes_to_keep = [node for node in nodes if node in set_path]
    nodes_to_keep_indexes = [nodes.index(node) for node in nodes_to_keep]
    pruned_adj_list = [adj_list[index] for index in nodes_to_keep_indexes]
    pruned_lat_n_longs = [lat_n_longs[index] for index in nodes_to_keep_indexes]

    return nodes_to_keep, pruned_adj_list, pruned_lat_n_longs


def process_graph(graph, data_dict, central_node, n_paths=2, max_hops=4):
    """process a single graph, getting all adjacent nodes and
    and add them to a the dictionary mapping the stations"""

    #     getting all information from the graph object
    zipper = get_neighbourhood(graph)
    nodes = list(graph.nodes)
    lat_n_longs = list(zipper)
    adj_list = list(graph.adjacency())


    nodes, adj_list, lat_n_longs = prune_nodes(
        central_node,
        nodes,
        adj_list,
        lat_n_longs,
        n_paths,
        max_hops
    )
    nodes = list(map(str, nodes))

    #     mapping adjacent streets
    for i, node in enumerate(nodes):
        data_dict["stations"][str(node)] = {}
        data_dict["stations"][str(node)]["type"] = "street"
        data_dict["stations"][str(node)]["lat"] = lat_n_longs[i][0]
        data_dict["stations"][str(node)]["lng"] = lat_n_longs[i][1]
        next_stops = list(map(str, adj_list[i][1].keys()))
        # data_dict["stations"][str(node)]["next_stops"] = next_stops
        data_dict['stations'][str(node)]['next_stops'] = [stop for stop in next_stops if stop in nodes]



def process_stations(data_dict, distance=300):  
    """processing all stations from the input file"""
    #     opening the json and converting to dict
    temp_dict = {"stations": {}}
    for key in data_dict["stations"].keys():
        # creating the graph and finding the closes node to the station and
        # appending it

        lat = data_dict["stations"][key]["lat"]
        long = data_dict["stations"][key]["lng"]
        graph = ox.core.graph_from_point(
            center_point=(lat, long),
            distance=distance,
            network_type="drive",
            simplify=True,
        )
        central_node = get_central_node(graph, lat, long)
        data_dict["stations"][str(key)]["next_stops"].append(str(central_node))

        process_graph(graph, temp_dict, central_node)
        temp_dict["stations"][str(central_node)]["next_stops"].append(str(key))

    data_dict["stations"].update(temp_dict["stations"])
    return data_dict


if __name__ == "__main__":
    data_dict = open_json("stations.json")
    process_stations(data_dict,)
    with open("stations_and_streets.json", "w") as file:
        json.dump(data_dict, file, default=str)
