import { writable, get } from 'svelte/store';
import creteDefaultGraph from "./Graph.default.js"
import providers from "$lib/models/ProviderInfo.svelte.js"
import models from '$lib/models/ModelInfo.svelte.js';

const CONTEXT_KEY = Symbol("graph");

class GraphState
{
    constructor()
    {
        const graphJson = creteDefaultGraph(); // this.loadFromLocalStorage();
        this.upgradeGraph(graphJson);

        this.nodes = writable(graphJson.nodes);
        this.edges = writable(graphJson.edges);
        this.OnChange = () => {};
    }

    // loadFromLocalStorage() 
    // {
    //     if (localStorage.graph)
    //         return JSON.parse(localStorage.graph);
    //     else
    //         return creteDefaultGraph();
    // }

    async LoadFromFile(graphJson)
    {
        if (typeof graphJson === 'string')
            graphJson = JSON.parse(graphJson);

        await this.upgradeGraph(graphJson);
        this.nodes.set(graphJson.nodes);
        this.edges.set(graphJson.edges);
    }

    async upgradeGraph(graphJson)
    {
        graphJson.nodes.forEach(node => 
        {
            if (node.data.markdown)
            {
                node.data.markdowns = [node.data.markdown];
                delete node.data.markdown;
            }
            
            if (node.data.html)
                delete node.data.html;

            if (node.data.htmls)
                delete node.data.htmls;

            if (node.data.model &&
                !node.data.provider)
            {
                providers.List.forEach(provider => 
                {
                    if (provider.ModelById[node.data.model])
                        node.data.provider = provider.id;
                });
            }
        });
    }

    AddNode(node)
    {
        this.nodes.update((nodes) => 
        {
            nodes.push(node);
            return nodes;
        });

        this.OnChange();
    }

    AddEdge(sourceId, targetId)
    {
        this.edges.update((edges) => 
        {
            edges.push({source : sourceId, target: targetId, id : (new Date).getTime().toString()});
            return edges;
        });

        this.OnChange();
    }
    
    RemoveNode(node) 
    {
        this.nodes.update((nodes) => 
        {
            return nodes.filter((node2) => node2.id != node.id);
        });

        this.edges.update((edges) => 
        {
            return edges.filter((edge) => 
                edge.source != node.id && 
                edge.target != node.id);
        });
        
        this.OnChange();
    }

    RemoveEdge(edge) 
    {
        this.edges.update((edges) => 
        {
            return edges.filter((edge2) => 
                edge2.source != edge.source || 
                edge2.target != edge.target);
        });

        this.OnChange();
    }

    RemovePrevEdge(connection)
    {
        const newEdge = {};
        newEdge[connection.fromHandle.type] = connection.fromHandle.nodeId;
        newEdge[connection.toHandle.type] = connection.toHandle.nodeId;

        this.edges.update((edges) => 
        {
            for (let i = edges.length - 1; i >= 0; i--)
            {
                let oldEdge = edges[i];

                if (!newEdge.id)
                {
                    if (oldEdge.source == newEdge.source &&
                        oldEdge.target == newEdge.target)
                    {
                        newEdge.id = oldEdge.id;
                    }
                }
                else
                {
                    if (oldEdge.target == newEdge.target)
                    {
                        if (oldEdge.id != newEdge.id)
                            edges.splice(i, 1);
                    }
                }
            }

            return edges;
        });

        this.OnChange();
    }

    UpdateNode (id, update)
    {
        this.nodes.update((nodes) => 
        {
            const node = nodes.find((node) => node.id === id);

            if (node)
            {
                node.data = { ...node.data, ...update };
                // console.log("[UpdateNode]", node);
            }
            
            return nodes;
        });

        this.OnChange();
    }

    Dump ()
    {
        return {
            nodes : get(this.nodes),
            edges : get(this.edges)
        };
    }

    GetPrompt (targetId)
    {
        // GET EDGE
    
        const allEdges = get(this.edges);
        const sourceEdge = allEdges.find((edge) => edge.target === targetId);
    
        if (!sourceEdge)
            return "";
    
        // GET NODE
    
        const allNodes = get(this.nodes);
        const sourceNode = allNodes.find((node) => node.id === sourceEdge.source);

        if (!sourceNode)
        {
            console.log("[Graph: GetPrompt] Node not found: " + sourceEdge.source);
            return "";
        }
    
        // GET TEXT
    
        let result;
    
        switch (sourceNode.type)
        {
            case "textInput": result = { role : "user", content : [sourceNode.data.value]}; break;
            case "generate": result = { role : "model", content : sourceNode.data.markdowns}; break;
        }
    
        return [ ...this.GetPrompt(sourceNode.id), result];
    }
}

const graph = new GraphState();
export default graph;