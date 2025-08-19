<script>
  
	import { getContext } from 'svelte';
  import { Handle, Position, NodeResizer } from '@xyflow/svelte';
  import CopyTextButton from '../Common/CopyTextButton.svelte';

  const appState = getContext("appState");

  let {id, data, selected} = $props();
  let value = $state(data.value);

  function onChange ()
  {
    appState.graph.UpdateNode(id, {value: value});
  }

</script>

<NodeResizer 
  minWidth={100} 
  minHeight={30} 
  onResizeEnd={() => appState.graph.OnChange()} />

<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />

<div class="canvas-node" class:is-selected={selected}>
  <div class="canvas-node-container">
    
    <node-content>
      <node-header>
        <node-header-left>Input</node-header-left>
        <node-header-right>
          <CopyTextButton text={value} />
        </node-header-right>

      </node-header>
      <node-body class="nomenu">

        <textarea 
          bind:value 
          onchange={onChange}
          class="nodrag nozoom node-text"></textarea>

      </node-body>
    </node-content>

  </div>
</div>

<style>
  
  textarea
  {
    text-align: left;
  }

</style>