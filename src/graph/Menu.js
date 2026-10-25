import nodeTypes from '$lib/nodes/Type/NodeTypes.js';
import FileSelectModal from '$lib/svelte-obsidian/src/FileSelectModal.js';
import { showContextMenu, showConfirmMenu } from '$lib/svelte-obsidian/src/Menu.js';
import { createId } from '../svelte-obsidian/src/CreateId.js';

export default class GraphMenu
{
    constructor(viewState)
    {
        this.viewState = viewState;
        this.graph = viewState.graph;
        this.app = viewState.app;
    }

    showNode (event, node)
    {
        if (event.target.closest(".nomenu"))
            return;

        const contextItems = this.viewState.contextItems.getSingle(node.id)?.() ?? [];

        const menu = 
        [{
            app : this.app,
            event : event,
            class : 'canvas-llm svelte-obsidian'
        },
        ...contextItems];

        menu.push
        ({
            icon : "x",
            title : "Delete node",
            class : "is-warning",
            onclick : e => this.removeNode(e, node)
        });

        showContextMenu(menu);
    }

    showEdge(event, edge)
    {
        if (event.target.closest(".nomenu"))
            return;

        const menu = 
        [{
            app : this.app,
            event : event,
            class : 'canvas-llm svelte-obsidian'
        }];

        menu.push
        ({
            icon : "x",
            title : "Delete edge",
            class : "is-warning",
            onclick : e => this.removeEdge(e, edge)
        });

        showContextMenu(menu);
    }

    showPane (event, screenToFlowPosition, connection)
    {
        if (event.target.closest(".nomenu"))
            return;

        const menu = 
        [{
            app : this.app,
            event : event,
            class : 'canvas-llm svelte-obsidian'
        }];

        for (let i = 0; i < nodeTypes.List.length; i++)
        {
            const nodeType = nodeTypes.List[i];

            if (i > 0 && nodeType.category !== nodeTypes.List[i-1].category)
                menu.push(null);
            
            menu.push
            ({
                icon : nodeType.icon,
                title : nodeType.name,
                class : 'menu-item-' + nodeType.id,
                onclick : () => this.addNode(event, nodeType, screenToFlowPosition, connection)
            });
        }

        if (!connection)
        {
            menu.push(null);

            menu.push
            ({
                icon : 'copy-plus',
                title : 'Copy from file',
                class : 'menu-item-insertFromFile',
                onclick : () => this.insertFromFile(event, screenToFlowPosition)
            });
        }

        showContextMenu(menu);
    }

    addNode(event, nodeType, screenToFlowPosition, connection)
    {
        let newNode = nodeType.getDefault();
        newNode.id = createId();
        newNode.origin = [0.0, 0.0];

        newNode.position = screenToFlowPosition
        ({
            x : event.clientX,
            y : event.clientY
        });

        this.graph.addNode(newNode);

        if (connection)
        {
            this.graph.removePrevEdge(connection);

            if (connection.fromHandle.type == "source")
            {
                this.graph.addEdge(
                    connection.fromNode.id, 
                    newNode.id);
            }
            else
            {
                this.graph.addEdge(
                    newNode.id, 
                    connection.fromNode.id,
                    connection.fromHandle.id);
            }
        }

        this.viewState.saveGraph("addNode");
    }

    removeNode(event, node)
    {
        showConfirmMenu("Delete node?", event, () => 
        {
            this.graph.removeNode(node);
            this.viewState.saveGraph("removeNode");
        });
    }

    removeEdge(event, edge)
    {
        showConfirmMenu("Delete edge?", event, () => 
        {
            this.graph.removeEdge(edge);
            this.viewState.saveGraph("removeEdge");
        });
    }

    insertFromFile(event, screenToFlowPosition)
    {
        const viewState = this.viewState;
        const graph = this.graph;
        const app = this.app;

        const offset = screenToFlowPosition
        ({
            x : event.clientX,
            y : event.clientY
        });

        new FileSelectModal(
            app, 
            ["canvas-llm"],
            async (file) => 
            { 
                const text = await app.vault.read(file);
                const canvas = JSON.parse(text);

                if (!canvas.nodes)
                    return;

                const idMap = {};
                const min_x = Math.min(...canvas.nodes.map(node => node.position.x));
                const min_y = Math.min(...canvas.nodes.map(node => node.position.y));

                for (const node of canvas.nodes)
                {
                    const newId = createId();
                    const oldId = node.id;

                    node.id = idMap[oldId] = newId;
                    node.selected = true

                    if (node.type === 'dialogue' &&
                        node.data.messages &&
                        node.data.messages[oldId])
                    {
                        node.data.messages[newId] = node.data.messages[oldId];
                        delete node.data.messages[oldId];
                    }

                    node.position =
                    {
                        x : node.position.x - min_x + offset.x,
                        y : node.position.y - min_y + offset.y
                    };
                }

                for (const edge of canvas.edges)
                {
                    edge.source = idMap[edge.source];
                    edge.target = idMap[edge.target];
                    edge.id = createId();
                }

                const oldNodes = graph.nodes.map(node => ({...node, selected : false}));
                graph.nodes = [...oldNodes, ...canvas.nodes];
                graph.edges = [...graph.edges, ...canvas.edges];
                viewState.saveGraph("insertFromFile");
            })
            .open();
    }
}