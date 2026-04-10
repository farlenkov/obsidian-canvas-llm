<script>

    import { getContext } from 'svelte';
    import { NodeResizer } from '@xyflow/svelte';

    const appState = getContext("appState");
    let { inputs, minWidth, minHeight } = $props();

</script>

<NodeResizer 
    minWidth={minWidth} 
    minHeight={minHeight + (inputs ? inputs.length * 15 + 16 : 0)} 
    onResizeEnd={() => appState.graph.onChange("NodeResize")} />