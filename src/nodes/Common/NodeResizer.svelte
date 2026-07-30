<script>

    import { getContext } from 'svelte';
    import { NodeResizer } from '@xyflow/svelte';

    const viewState = getContext("viewState");
    let { inputs, minWidth, minHeight, callback } = $props();

    function onResizeStart()
    {
        if (callback)
            callback(true);
    }

    function onResizeEnd()
    {
        viewState.saveGraph("nodeResize");

        if (callback)
            callback(false);
    }

</script>

<NodeResizer 
    minWidth={minWidth} 
    minHeight={minHeight + (inputs ? inputs.length * 15 + 16 : 0)} 
    onResizeStart={onResizeStart}
    onResizeEnd={onResizeEnd} />