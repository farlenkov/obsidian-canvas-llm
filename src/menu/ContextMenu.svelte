<script>
  
    import { getContext } from 'svelte';
    import { useSvelteFlow } from '@xyflow/svelte';
    import { SquareXIcon, CopyPlus } from 'lucide-svelte';

    import FileSelectModal from '$lib/svelte-obsidian/src/FileSelectModal.js';
    import nodeTypes from '$lib/nodes/Type/NodeTypes.js';
    import { createNodeId, createEdgeId } from '$lib/graph/CreateId';

    const viewState = getContext("viewState");
    const { screenToFlowPosition } = useSvelteFlow();

    function addNode(nodeType)
    {
        let newNode = nodeType.getDefault();
        newNode.id = createNodeId();
        newNode.origin = [0.0, 0.0];

        newNode.position = screenToFlowPosition(
        {
            x : viewState.contextMenu.Event.clientX,
            y : viewState.contextMenu.Event.clientY
        });

        viewState.graph.addNode(newNode);

        if (viewState.contextMenu.Connection)
        {
            viewState.graph.removePrevEdge(viewState.contextMenu.Connection);

            if (viewState.contextMenu.Connection.fromHandle.type == "source")
            {
                viewState.graph.addEdge(
                    viewState.contextMenu.Connection.fromNode.id, 
                    newNode.id);
            }
            else
            {
                viewState.graph.addEdge(
                    newNode.id, 
                    viewState.contextMenu.Connection.fromNode.id,
                    viewState.contextMenu.Connection.fromHandle.id);
            }
        }

        viewState.saveGraph("addNode");
        viewState.contextMenu.Hide();
    }
    
    function nodeRemove() 
    {
        viewState.graph.removeNode(viewState.contextMenu.Node);
        viewState.contextMenu.Hide();
        viewState.saveGraph("removeNode");
    }

    function edgeRemove()
    {
        viewState.graph.removeEdge(viewState.contextMenu.Edge);
        viewState.contextMenu.Hide();
        viewState.saveGraph("removeEdge");
    }

    function insertFromFile()
    {
        const offset = screenToFlowPosition(
        {
            x : viewState.contextMenu.Event.clientX,
            y : viewState.contextMenu.Event.clientY
        });

        new FileSelectModal(
            viewState.app, 
            ["canvas-llm"],
            async (file) => 
            { 
                const text = await viewState.app.vault.read(file);
                const canvas = JSON.parse(text);

                if (!canvas.nodes)
                    return;

                const idMap = {};
                const min_x = Math.min(...canvas.nodes.map(node => node.position.x));
                const min_y = Math.min(...canvas.nodes.map(node => node.position.y));

                for (const node of canvas.nodes)
                {
                    const newId = createNodeId();
                    const oldId = node.id;
                    node.id = idMap[oldId] = newId;

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
                    edge.id = createEdgeId();
                }

                viewState.graph.nodes = [...viewState.graph.nodes, ...canvas.nodes];
                viewState.graph.edges = [...viewState.graph.edges, ...canvas.edges];
                viewState.saveGraph("insertFromFile");
            })
            .open();

      viewState.contextMenu.Hide();
    }

  </script>

{#if viewState.contextMenu.IsVisible}

    <div
        style:top={viewState.contextMenu.Top}
        style:left={viewState.contextMenu.Left}
        style:right={viewState.contextMenu.Right}
        style:bottom={viewState.contextMenu.Bottom}
        class="context-menu- menu">
    
        {#if viewState.contextMenu.Node}

            <div class="context-menu-item- menu-item tappable is-warning" onclick={nodeRemove}>
                <SquareXIcon size={24} class="menu-item-icon" />
                <div class="menu-item-title">Delete node</div>
            </div>

        {:else if viewState.contextMenu.Edge}

            <div class="context-menu-item- menu-item tappable is-warning" onclick={edgeRemove}>
                <SquareXIcon size={24} class="menu-item-icon" />
                <div class="menu-item-title">Delete edge</div>
            </div>

        {:else}

            {#each nodeTypes.List as nodeType}

                <div 
                    class="context-menu-item- menu-item tappable" 
                    aria-label="{nodeType.desc}"
                    onclick={() => addNode(nodeType)}>

                    <svelte:component 
                        this={nodeType.icon} 
                        size={24} 
                        class="menu-item-icon menu-item-icon-{nodeType.id}" />

                    <div class="menu-item-title">{nodeType.name}</div>
                </div>

            {/each}

        <div 
            class="context-menu-item- menu-item tappable" 
            aria-label="Copy graph from another Canvas LLM file"
            onclick={insertFromFile}>

            <svelte:component 
                this={CopyPlus} 
                size={24} 
                class="menu-item-icon menu-item-icon-insertFromFile" />

            <div class="menu-item-title">Copy from file</div>
          </div>

        {/if}

    </div>

{/if}
   
<style>

    .menu
    {
        position: absolute;
        z-index: 10;
    }

    .menu-item.tappable:hover
    {
        background-color: var(--background-modifier-hover);
    }

    .menu-item:not(.tappable)
    {
        padding: 0.5em;
        color: var(--text-accent);
    }

</style>