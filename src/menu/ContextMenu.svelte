<script>
  
    import { useSvelteFlow } from '@xyflow/svelte';
    import { SquareXIcon, TextCursorInputIcon, BotIcon, SquarePlayIcon } from 'lucide-svelte';

    import {CreateNodeId, CreateEdgeId} from '$lib/utils/CreateId';
    import graph from '$lib/graph/Graph.svelte.js';
    import settings from '$lib/overlay/Settings.svelte.js';
    import contextMenu from '$lib/menu/ContextMenu.svelte.js';

    const { screenToFlowPosition } = useSvelteFlow();

    function addNode(newNode)
    {
        newNode.id = CreateNodeId();
        newNode.origin = [0.0, 0.0];

        newNode.position = screenToFlowPosition(
        {
            x : contextMenu.Event.clientX,
            y : contextMenu.Event.clientY
        });

        graph.AddNode(newNode);

        if (contextMenu.Connection)
        {
            if (contextMenu.Connection.fromHandle.type == "source")
            {
                graph.AddEdge(
                    contextMenu.Connection.fromNode.id, 
                    newNode.id);
            }
            else
            {
                graph.AddEdge(
                    newNode.id, 
                    contextMenu.Connection.fromNode.id);
            }
        }

        contextMenu.Hide();
    }

    function addTextInput()
    {
        addNode
        ({
          type:"textInput", 
          width: 260, 
          height: 120, 
          data : { value : "" }
        });
    }

    function addGenerate()
    {
        const defaultModel = settings.GetDefaultModel();

        addNode
        ({
          type:"generate", 
          width: 460, 
          height: 340, 
          data : 
          { 
            markdowns : [""], 
            provider : defaultModel.providerId, 
            model : defaultModel.id 
          }
        });
    }
    
    function nodeRemove() 
    {
        graph.RemoveNode(contextMenu.Node);
        contextMenu.Hide();
    }

    function edgeRemove()
    {
        graph.RemoveEdge(contextMenu.Edge);
        contextMenu.Hide();
    }

  </script>

{#if contextMenu.IsVisible}

  <div
    style:top={contextMenu.Top}
    style:left={contextMenu.Left}
    style:right={contextMenu.Right}
    style:bottom={contextMenu.Bottom}
    class="context-menu- menu">
   
    {#if contextMenu.Node}

      <div class="context-menu-item- menu-item tappable is-warning" onclick={nodeRemove}>
        <SquareXIcon size={24} color="red" class="menu-item-icon" />
        <div class="menu-item-title">Delete node</div>
      </div>

    {:else if contextMenu.Edge}

      <div class="context-menu-item- menu-item tappable is-warning" onclick={edgeRemove}>
        <SquareXIcon size={24} color="red" class="menu-item-icon" />
        <div class="menu-item-title">Delete edge</div>
      </div>

    {:else}

      <div class="context-menu-item- menu-item tappable" onclick={addTextInput}>
        <TextCursorInputIcon size={24} color="#00abff" class="menu-item-icon" />
        <div class="menu-item-title">Add TextInput</div>
      </div>

      <div class="context-menu-item- menu-item tappable" onclick={addGenerate}>
        <SquarePlayIcon size={24} color="#00abff" class="menu-item-icon" />
        <div class="menu-item-title">Add Generator</div>
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