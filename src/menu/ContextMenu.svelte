<script>
  
    import { getContext } from 'svelte';
    import { useSvelteFlow } from '@xyflow/svelte';
    import { SquareXIcon, TextCursorInputIcon, BotIcon, SquarePlayIcon } from 'lucide-svelte';

    import { CreateNodeId, CreateEdgeId } from '$lib/utils/CreateId';

    const appState = getContext("appState");
    const { screenToFlowPosition } = useSvelteFlow();

    function addNode(newNode)
    {
        newNode.id = CreateNodeId();
        newNode.origin = [0.0, 0.0];

        newNode.position = screenToFlowPosition(
        {
            x : appState.contextMenu.Event.clientX,
            y : appState.contextMenu.Event.clientY
        });

        appState.graph.AddNode(newNode);

        if (appState.contextMenu.Connection)
        {
            if (appState.contextMenu.Connection.fromHandle.type == "source")
            {
                appState.graph.AddEdge(
                    appState.contextMenu.Connection.fromNode.id, 
                    newNode.id);
            }
            else
            {
                appState.graph.AddEdge(
                    newNode.id, 
                    appState.contextMenu.Connection.fromNode.id);
            }
        }

        appState.contextMenu.Hide();
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
        const defaultModel = appState.settings.GetDefaultModel();

        addNode
        ({
          type:"generate", 
          width: 460, 
          height: 340, 
          data : 
          { 
            markdowns : [], 
            provider : defaultModel.providerId, 
            model : defaultModel.id 
          }
        });
    }
    
    function nodeRemove() 
    {
        appState.graph.RemoveNode(appState.contextMenu.Node);
        appState.contextMenu.Hide();
    }

    function edgeRemove()
    {
        appState.graph.RemoveEdge(appState.contextMenu.Edge);
        appState.contextMenu.Hide();
    }

  </script>

{#if appState.contextMenu.IsVisible}

  <div
    style:top={appState.contextMenu.Top}
    style:left={appState.contextMenu.Left}
    style:right={appState.contextMenu.Right}
    style:bottom={appState.contextMenu.Bottom}
    class="context-menu- menu">
   
    {#if appState.contextMenu.Node}

      <div class="context-menu-item- menu-item tappable is-warning" onclick={nodeRemove}>
        <SquareXIcon size={24} class="menu-item-icon" />
        <div class="menu-item-title">Delete node</div>
      </div>

    {:else if appState.contextMenu.Edge}

      <div class="context-menu-item- menu-item tappable is-warning" onclick={edgeRemove}>
        <SquareXIcon size={24} class="menu-item-icon" />
        <div class="menu-item-title">Delete edge</div>
      </div>

    {:else}

      <div class="context-menu-item- menu-item tappable" onclick={addTextInput}>
        <TextCursorInputIcon size={24} class="menu-item-icon" />
        <div class="menu-item-title">Add text input</div>
      </div>

      <div class="context-menu-item- menu-item tappable" onclick={addGenerate}>
        <SquarePlayIcon size={24} class="menu-item-icon" />
        <div class="menu-item-title">Add generator</div>
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