import { createNodeId, createEdgeId } from '$lib/graph/CreateId';
import { PlaceholderSet } from '$lib/svelte-obsidian/src/Placeholder.js';
import providers from '$lib/svelte-llm/models/ProviderInfo.svelte.js';
import nodeTypes from '$lib/nodes/Type/NodeTypes.js';

export default class GraphState
{
    constructor(file)
    {
        this.fileVersion = 2;

        this.file = file;
        this.nodes = $state.raw([]);
        this.edges = $state.raw([]);
        this.getNodeContent = {};
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

    addEdge(sourceId, targetId, targetHandle)
    {
        const newEdge = 
        {
            source : sourceId, 
            target: targetId, 
            id : createEdgeId(sourceId, targetId)
        };

        if (targetHandle)
            newEdge.targetHandle = targetHandle;

        this.edges = [...this.edges, newEdge];
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
        {
            if (edge2.source        === edge.source &&
                edge2.target        === edge.target &&
                edge2.targetHandle  === edge.targetHandle)
                return false;
            else
                return true;
        });

        this.onChange("removeEdge");
    }

    removePrevEdge(connection)
    {
        const newEdge = {};
        newEdge[connection.fromHandle.type] = connection.fromHandle.nodeId;
        newEdge[connection.toHandle.type] = connection.toHandle.nodeId;

        if (connection.fromHandle.id)
            newEdge[connection.fromHandle.type + 'Handle'] = connection.fromHandle.id;

        if (connection.toHandle.id)
            newEdge[connection.toHandle.type + 'Handle'] = connection.toHandle.id;

        this.edges = this.edges.filter(oldEdge => 
        {
            if (oldEdge.target === newEdge.target &&
                oldEdge.targetHandle  === newEdge.targetHandle &&
                oldEdge.source !== newEdge.source)
                return false;
            else
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
    
        const sourceEdge = this.edges.find((edge) => 
            edge.target === targetId && 
            !edge.targetHandle);
    
        if (!sourceEdge)
            return [targetNode];

        if (loop[sourceEdge.source])
            return [targetNode];

        return [...this.getBranch(sourceEdge.source, loop), targetNode];
    }

    async getMessages (targetId, app)
    {
        const branch = this.getBranch(targetId);
        const result = [];

        for (const node of branch)
        {
            const message = await this.getMessage(node, app);

            if (message)
                result.push(message);
        }

        return result;
    }

    async getMessage (node, app, usedNodes)
    {
        const message = await this.getNodeContent[node.id]();

        usedNodes = usedNodes || {};
        usedNodes[node.id] = message;
                    
        if (!node.data.template)
            return message;

        message.content = await this.applyTemplate(
            app,
            node,
            message.content,
            usedNodes);

        return message;
    }

    async applyTemplate(app, node, text, usedNodes)
    {
        const edges = this.edges.filter((edge) => edge.target === node.id);
        const values = {};

        for (let edge of edges)
        {
            if (usedNodes[edge.source])
            {
                values[edge.targetHandle] = usedNodes[edge.source].content;
                continue;
            }

            const sourceNode = this.nodes.find((node) => node.id === edge.source);
            const sourceMessage = await this.getMessage(sourceNode, app, usedNodes);

            if (sourceMessage)
                values[edge.targetHandle] = sourceMessage.content;
        }

        return text.replace(
            PlaceholderSet.REGEX, 
            (match, key, defaultValue) => 
            {
                const result = key in values 
                    ? values[key] 
                    : defaultValue?.trim() ?? match;

                return result;
            });
    }
}