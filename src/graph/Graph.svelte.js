import { writable, get } from 'svelte/store';
import {CreateNodeId, CreateEdgeId} from '$lib/utils/CreateId';
import providers from "$lib/models/ProviderInfo.svelte.js"

class GraphState
{
    FileVersion = 1;

    constructor()
    {
        this.nodes = $state.raw([]);
        this.edges = $state.raw([]);
        this.OnChange = () => {};
    }

    async LoadFromFile(graphJson)
    {
        if (typeof graphJson === 'string')
            graphJson = JSON.parse(graphJson);

        await this.upgradeGraph(graphJson);
        this.nodes = graphJson.nodes;
        this.edges = graphJson.edges;
    }

    async upgradeGraph(graphJson)
    {
        if (!graphJson.version)
            graphJson.version = this.FileVersion;
        
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
        this.nodes = [...this.nodes, node];
        this.OnChange();
    }

    AddEdge(sourceId, targetId)
    {
        this.edges = [...this.edges, 
        {
            source : sourceId, 
            target: targetId, 
            id : CreateEdgeId(sourceId, targetId)
        }];

        this.OnChange();
    }
    
    RemoveNode(node) 
    {
        // this.nodes.update((nodes) => 
        // {
        //     return nodes.filter((node2) => node2.id != node.id);
        // });

        // this.edges.update((edges) => 
        // {
        //     return edges.filter((edge) => 
        //         edge.source != node.id && 
        //         edge.target != node.id);
        // });

        this.nodes = this.nodes.filter((node2) => 
            node2.id != node.id);

        this.edges = this.edges.filter((edge) => 
            edge.source != node.id && 
            edge.target != node.id);
        
        this.OnChange();
    }

    RemoveEdge(edge) 
    {
        // this.edges.update((edges) => 
        // {
        //     return edges.filter((edge2) => 
        //         edge2.source != edge.source || 
        //         edge2.target != edge.target);
        // });

        this.edges = this.edges.filter((edge2) => 
            edge2.source != edge.source || 
            edge2.target != edge.target);

        this.OnChange();
    }

    RemovePrevEdge(connection)
    {
        const newEdge = {};
        newEdge[connection.fromHandle.type] = connection.fromHandle.nodeId;
        newEdge[connection.toHandle.type] = connection.toHandle.nodeId;

        // this.edges.update((edges) => 
        // {
        //     for (let i = edges.length - 1; i >= 0; i--)
        //     {
        //         let oldEdge = edges[i];

        //         if (!newEdge.id)
        //         {
        //             if (oldEdge.source == newEdge.source &&
        //                 oldEdge.target == newEdge.target)
        //             {
        //                 newEdge.id = oldEdge.id;
        //             }
        //         }
        //         else
        //         {
        //             if (oldEdge.target == newEdge.target)
        //             {
        //                 if (oldEdge.id != newEdge.id)
        //                     edges.splice(i, 1);
        //             }
        //         }
        //     }

        //     return edges;
        // });

        this.edges = this.edges.filter(oldEdge => 
        {
            // console.log("oldEdge", oldEdge.id, oldEdge.source, ">", oldEdge.target);

            // if (!newEdge.id)
            // {
            //     if (oldEdge.source == newEdge.source &&
            //         oldEdge.target == newEdge.target)
            //     {
            //         newEdge.id = oldEdge.id;
            //         console.log("set newEdge.id", newEdge.id);
            //     }
            // }
            // else
            // {
                if (oldEdge.target == newEdge.target)
                {
                    if (oldEdge.source != newEdge.source)
                        return false;
                }
            // }

            return true;
        });

        this.OnChange();
    }

    UpdateNode (id, update)
    {
        // this.nodes.update((nodes) => 
        // {
        //     const node = nodes.find((node) => node.id === id);

        //     if (node)
        //     {
        //         node.data = { ...node.data, ...update };
        //         // console.log("[UpdateNode]", node);
        //     }
            
        //     return nodes;
        // });

        this.nodes = this.nodes.map(node => 
        {
            if (node.id == id)
                return { ...node, data : { ...node.data, ...update } };
                // node.data = { ...node.data, ...update };

            return node;
        });

        this.OnChange();
    }

    ToString ()
    {
        var data = 
        {
            version : this.FileVersion,
            nodes : this.nodes,
            edges : this.edges
        };

        return JSON.stringify(data, null, '\t');
    }

    GetPrompt (targetId, loop = {})
    {
        loop[targetId] = true;

        // GET EDGE
    
        const sourceEdge = this.edges.find((edge) => edge.target === targetId);
    
        if (!sourceEdge)
            return [];
    
        // GET NODE
    
        const sourceNode = this.nodes.find((node) => node.id === sourceEdge.source);

        if (!sourceNode)
        {
            console.log("[Graph: GetPrompt] Node not found: " + sourceEdge.source);
            return [];
        }

        if (loop[sourceNode.id])
            return [];
    
        // GET TEXT
    
        let result;
    
        switch (sourceNode.type)
        {
            case "textInput": result = { role : "user", content : [sourceNode.data.value]}; break;
            case "generate": result = { role : "model", content : [sourceNode.data.markdowns[sourceNode.data.part]]}; break;
        }
    
        return [ ...this.GetPrompt(sourceNode.id, loop), result];
    }
}

const graph = new GraphState();
export default graph;