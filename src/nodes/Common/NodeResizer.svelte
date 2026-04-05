<script>

    import { getContext } from 'svelte';
    import { NodeResizer } from '@xyflow/svelte';

    const appState = getContext("appState");
    let { placeholders, minWidth, minHeight } = $props();

</script>

<NodeResizer 
    minWidth={minWidth} 
    minHeight={minHeight + (placeholders ? placeholders.length * 15 + 16 : 0)} 
    onResizeEnd={() => appState.graph.onChange("NodeResize")} />