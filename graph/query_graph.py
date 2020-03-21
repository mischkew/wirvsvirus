#!/usr/bin/env python
# coding: utf-8

# In[1]:


import osmnx as ox
import networkx as nx
from sklearn.neighbors import KDTree
import matplotlib.pyplot as plt
import numpy as np
import json
import hashlib 


# In[2]:


# distance from station for which adjacent nodes should be retrieved
distance=100


# In[3]:


def get_central_node(graph,lat, long,distance=100):
    """given a geocoded loction and a graph return 
        find the node closests to the location """
    graph_df,_ = ox.graph_to_gdfs(graph)
    graph_tree = KDTree(graph_df[['y', 'x']], metric='euclidean')
    adress_idx = graph_tree.query([(lat,long)], k=1, return_distance=False)[0]
    closest_node = graph_df.iloc[adress_idx].index.values[0]
    return closest_node

    


# In[4]:


def open_json(file_path):
    with open(file_path) as file:
        data_dict = json.loads(file.read())
    return data_dict
    


# In[5]:


def get_neighbourhood(graph):
    '''extract the lat long locations'''
    lats = [float(y) for _, y in graph.nodes(data='y')]
    lngs = [float(x) for _, x in graph.nodes(data='x')]
    return zip(lats, lngs)


# In[9]:


def process_graph(graph, data_dict):
    """process a single graph, getting all adjacent nodes and 
    and  add them to a the dictionary mapping the stations"""
    
#     getting all information from the graph object
    zipper = get_neighbourhood(graph)
    nodes = list(graph.nodes)
    lat_n_longs = list(zipper)
    
#     mapping adjacent streets
    
    adj_list = list(graph.adjacency())
    for i, node in enumerate(nodes):
        data_dict['stations'][str(node)]={}
        data_dict['stations'][str(node)]['type'] = 'street'
        data_dict['stations'][str(node)]['lat'] = lat_n_longs[i][0]
        data_dict['stations'][str(node)]['lng'] = lat_n_longs[i][1]
        data_dict['stations'][str(node)]['next_stops'] = list(adj_list[i][1].keys())
    
    return


# In[10]:


def process_stations(file_path, new_file,distance=100):
    """processing all stations from the input file"""
#     opening the json and converting to dict
    data_dict = open_json(file_path)
    temp_dict = {'stations':{}}
    for key in data_dict['stations'].keys():
#         creating the graph and finding the closes node to the station and appending it
        
        lat=data_dict['stations'][key]['lat']
        long=data_dict['stations'][key]['lng']
        graph=ox.core.graph_from_point((lat,long), distance=distance)
        central_node=get_central_node(graph, lat, long)
        data_dict['stations'][key]['next_stops'].append(central_node)
        
        process_graph(graph,temp_dict)    
        temp_dict['stations'][str(central_node)]['next_stops'].append(key)
        
        
    data_dict['stations'].update(temp_dict['stations'])
    
    with open(new_file,'w') as file:
        data_dict_as_json=json.dump(data_dict,file,default=str)
            


# In[11]:


process_stations('data/stations.json','data/stations_and_streets.json')

