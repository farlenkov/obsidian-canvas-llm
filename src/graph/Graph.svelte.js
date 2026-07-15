import { createNodeId, createEdgeId } from '$lib/graph/CreateId';
import { PlaceholderSet } from '$lib/svelte-obsidian/src/Placeholder.js';
import { EventEmitter } from '$lib/svelte-obsidian/src/Event.js';
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
        this.onChange = new EventEmitter();
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
    }

    addNode(node)
    {
        this.nodes = [...this.nodes, node];
        this.onChange.emit("addNode");
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
        this.onChange.emit("addEdge");
    }
    
    removeNode(node) 
    {
        const nodeCount = this.nodes.length;
        const edgeCount = this.edges.length;

        this.nodes = this.nodes.filter(node2 => 
            node2.id != node.id);

        if (this.nodes.length < nodeCount)
            this.onChange.emit("removeNode");

        this.edges = this.edges.filter(edge => 
            edge.source != node.id && 
            edge.target != node.id);        

        if (this.edges.length < edgeCount)
            this.onChange.emit("removeEdge");

        // console.log("nodeCount", nodeCount, this.nodes.length);
        // console.log("edgeCount", edgeCount, this.edges.length);
    }

    removeEdge(edge) 
    {
        this.edges = this.edges.filter(edge2 => 
        {
            if (edge2.source        === edge.source &&
                edge2.target        === edge.target &&
                edge2.targetHandle  === edge.targetHandle)
                return false;
            else
                return true;
        });

        this.onChange.emit("removeEdge");
    }

    removePrevEdge(connection)
    {
        const edgeCount = this.edges.length;
        let sourceId;
        let targetId;
        let targetHandle;

        if (connection.fromHandle?.type === 'target')
        {
            sourceId = connection.toNode?.id
            targetId = connection.fromHandle.nodeId;
            targetHandle = connection.fromHandle.id || undefined;
        }
        else if (connection.toHandle?.type === 'target')
        {
            sourceId = connection.fromNode?.id
            targetId = connection.toHandle.nodeId;
            targetHandle = connection.toHandle.id || undefined;
        }

        this.edges = this.edges.filter(oldEdge => 
        {
            if (oldEdge.target === targetId &&
                oldEdge.targetHandle === targetHandle &&
                oldEdge.source !== sourceId)
                return false;
            else
                return true;
        });

        if (this.edges.length < edgeCount)
            this.onChange.emit("removeEdge");
    }

    updateNode (id, update, note)
    {
        this.nodes = this.nodes.map(node => 
        {
            if (node.id == id)
                return { ...node, data : { ...node.data, ...update } };

            return node;
        });

        this.onChange.emit(note);
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
        const targetNode = this.nodes.find(node => node.id === targetId);

        if (!targetNode)
            return [];
    
        const sourceEdge = this.edges.find(edge => 
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
        if (typeof node !== 'object')
            node = this.nodes.find(node2 => node2.id === node);
        
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
        const edges = this.edges.filter(edge => edge.target === node.id);
        const values = {};

        for (let edge of edges)
        {
            if (usedNodes[edge.source])
            {
                values[edge.targetHandle] = usedNodes[edge.source].content;
                continue;
            }

            const sourceNode = this.nodes.find(node => node.id === edge.source);
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