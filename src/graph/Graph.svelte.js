import { createNodeId, createEdgeId } from '$lib/utils/CreateId';
import providers from '$lib/models/ProviderInfo.svelte.js';

export default class GraphState
{
    constructor(file)
    {
        this.fileVersion = 2;

        this.file = file;
        this.nodes = $state.raw([]);
        this.edges = $state.raw([]);
        this.onChange = () => {};
    }

    async loadFromFile(graphJson)
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
            graphJson.version = this.fileVersion;
        
        graphJson.nodes.forEach(node => 
        {
            // markdown to markdowns

            if (node.data.markdown)
            {
                node.data.markdowns = [node.data.markdown];
                delete node.data.markdown;
            }

            // remove html & htmls
            
            if (node.data.html)
                delete node.data.html;

            if (node.data.htmls)
                delete node.data.htmls;

            // model to provider

            if (node.data.model &&
                !node.data.provider)
            {
                providers.List.forEach(provider => 
                {
                    if (provider.ModelById[node.data.model])
                        node.data.provider = provider.id;
                });
            }

            // markdowns to results

            if (node.data.markdowns)
            {
                node.data.results = [];

                node.data.markdowns.forEach(markdown => 
                {
                    const result = 
                    {
                        provider : node.data.provider,
                        model : node.data.model,
                        text : markdown
                    };

                    if (Array.isArray(markdown))
                    {
                        result.think = markdown[0];
                        result.text = markdown[1];
                    }

                    node.data.results.push(result);
                });

                delete node.data.markdowns;
            }
        });
    }

    addNode(node)
    {
        this.nodes = [...this.nodes, node];
        this.onChange("addNode");
    }

    addEdge(sourceId, targetId)
    {
        this.edges = [...this.edges, 
        {
            source : sourceId, 
            target: targetId, 
            id : createEdgeId(sourceId, targetId)
        }];

        this.onChange("addEdge");
    }
    
    removeNode(node) 
    {
        this.nodes = this.nodes.filter((node2) => 
            node2.id != node.id);

        this.edges = this.edges.filter((edge) => 
            edge.source != node.id && 
            edge.target != node.id);
        
        this.onChange("removeNode");
    }

    removeEdge(edge) 
    {
        this.edges = this.edges.filter((edge2) => 
            edge2.source != edge.source || 
            edge2.target != edge.target);

        this.onChange("removeEdge");
    }

    removePrevEdge(connection)
    {
        const newEdge = {};
        newEdge[connection.fromHandle.type] = connection.fromHandle.nodeId;
        newEdge[connection.toHandle.type] = connection.toHandle.nodeId;

        this.edges = this.edges.filter(oldEdge => 
        {
            if (oldEdge.target == newEdge.target)
            {
                if (oldEdge.source != newEdge.source)
                    return false;
            }

            return true;
        });

        this.onChange("removePrevEdge");
    }

    updateNode (id, update, note)
    {
        this.nodes = this.nodes.map(node => 
        {
            if (node.id == id)
                return { ...node, data : { ...node.data, ...update } };

            return node;
        });

        this.onChange(note);
    }

    toString ()
    {
        const data = 
        {
            version : this.fileVersion,
            nodes : this.nodes,
            edges : this.edges
        };

        return JSON.stringify(data, null, '\t');
    }

    getBranch (targetId, loop = {})
    {
        loop[targetId] = true;
        const targetNode = this.nodes.find((node) => node.id === targetId);

        if (!targetNode)
            return [];
    
        const sourceEdge = this.edges.find((edge) => edge.target === targetId);
    
        if (!sourceEdge)
            return [targetNode];

        if (loop[sourceEdge.source])
            return [targetNode];

        return [...this.getBranch(sourceEdge.source, loop), targetNode];
    }

    getPrompt (targetId)
    {
        const branch = this.getBranch(targetId);
        const result = [];

        for (var i = 0; i < branch.length - 1; i++)
        {
            const node = branch[i];
            let message = null;

            switch (node.type)
            {
                case "textInput": message = { role : "user", content : [node.data.value]}; break;
                case "generate": message = { role : "model", content : [node.data.results[node.data.part].text]}; break;
            }

            result.push(message);
        }

        return result;
    }
}