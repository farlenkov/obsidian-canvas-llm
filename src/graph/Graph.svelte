<script>
  
    import {
        SvelteFlow,
        Controls, 
        ControlButton, 
        Background,
        BackgroundVariant,
        MiniMap,
        useUpdateNodeInternals
    } from '@xyflow/svelte';

    import { setContext } from 'svelte';
    import { MapIcon, Settings } from 'lucide-svelte';

    import ContextMenu from '$lib/menu/ContextMenu.svelte';
    import nodeTypes from '$lib/nodes/Type/NodeTypes.js';

    const { view : viewState } = $props();
    setContext("viewState", viewState);

    // const updateNodeInternals = useUpdateNodeInternals();
    // updateNodeInternals(1);

    const nodeTypesIndex = {};
    nodeTypes.List.forEach(nodeType => nodeTypesIndex[nodeType.id] = nodeType.view);
    
    let showMiniMap = $state(false);
    let zoomOnScroll = $state(true);
    let preventScrolling = $derived(zoomOnScroll);

    async function onConnectEnd(event, connection) 
    {
        if (connection.isValid) 
        {
            viewState.graph.removePrevEdge(connection);
            return;
        }
        
        await sleep(100);
        viewState.contextMenu.ShowConnect(event, connection);
    }

</script>

<div 
    class="graph-container"
    bind:clientWidth={viewState.contextMenu.CanvasWidth} 
    bind:clientHeight={viewState.contextMenu.CanvasHeight}>

    <SvelteFlow
        bind:nodes = {viewState.graph.nodes}
        bind:edges = {viewState.graph.edges}
        {zoomOnScroll}
        {preventScrolling}
        fitView
        fitViewOptions = {{maxZoom:1,minZoom:1}}
        proOptions = {{hideAttribution:true}}
        snapGrid = {[20,20]}
        nodeTypes = {nodeTypesIndex}
        onconnectstart = {() => viewState.contextMenu.Hide()}
        onconnectend = {onConnectEnd}
        ondelete = {(event) => viewState.saveGraph("ondelete")}
        deleteKey = {null}
        
        onpaneclick = {() => viewState.contextMenu.Hide()}
        onnodeclick = {() => viewState.contextMenu.Hide()}
        onedgeclick = {() => viewState.contextMenu.Hide()}

        onnodedragstart = {()   => viewState.contextMenu.Hide()}
        onnodedragstop = {()    => viewState.saveGraph("onnodedragstop")}

        onpanecontextmenu = {({ event })        => viewState.contextMenu.ShowPane(event)}
        onnodecontextmenu = {({ event, node })  => viewState.contextMenu.ShowNode(event, node)}
        onedgecontextmenu = {({ event, edge })  => viewState.contextMenu.ShowEdge(event, edge)}

        onnodepointermove   = {({event}) => { zoomOnScroll = event.target.closest(".nozoom") == null }}
        onnodepointerleave  = {() => { zoomOnScroll = true }}>

        <Controls position='bottom-left' orientation='horizontal'>
            <ControlButton onclick={() => showMiniMap = !showMiniMap} title="MiniMap" class={'canvas-llm-controll-button'}>
                <MapIcon size={24} />
            </ControlButton>
            <ControlButton onclick={() => viewState.showSettings()} title="Settings" class={'canvas-llm-controll-button'}>
                <Settings size={24} />
            </ControlButton>
        </Controls>
        
        <ContextMenu />

        {#if showMiniMap}
            <MiniMap />
        {/if}

        <Background 
            variant={BackgroundVariant.Dots} 
            patternColor="rgba(255,255,255,0.5)"
            gap={20}/>
        
    </SvelteFlow>
</div>

<style>
    .graph-container
    {
        height : 100%;
    }
</style>