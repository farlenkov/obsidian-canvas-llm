<script>
  
    import {
        SvelteFlow,
        SvelteFlowProvider,
        useSvelteFlow,
        Controls, 
        ControlButton, 
        Background,
        BackgroundVariant,
        MiniMap } from '@xyflow/svelte';

    import { setContext } from 'svelte';
    import { MapIcon, Settings } from 'lucide-svelte';

    import nodeTypes from '$lib/nodes/Type/NodeTypes.js';
    import GraphMenu from './Menu.js';

    const { view : viewState } = $props();
    const graphMenu = new GraphMenu(viewState);
    
    setContext("viewState", viewState);

    let showMiniMap = $state(false);
    let zoomOnScroll = $state(true);
    let preventScrolling = $derived(zoomOnScroll);

    async function onConnectEnd(event, connection, screenToFlowPosition) 
    {
        if (connection.isValid) 
        {
            viewState.graph.removePrevEdge(connection);
            viewState.saveGraph("onConnectEnd");
        }
        else
        {
            await sleep(100);
            graphMenu.showPane(event, screenToFlowPosition, connection);
        }
    }

</script>

<div class="graph-container">

    <SvelteFlowProvider>

        {@const { screenToFlowPosition } = useSvelteFlow ()}

        <SvelteFlow
            bind:nodes = {viewState.graph.nodes}
            bind:edges = {viewState.graph.edges}
            {zoomOnScroll}
            {preventScrolling}
            fitView
            fitViewOptions = {{maxZoom:1,minZoom:1}}
            proOptions = {{hideAttribution:true}}
            snapGrid = {[20,20]}
            nodeTypes = {nodeTypes.Views}

            onconnectend = {(event, connection) => onConnectEnd(event, connection, screenToFlowPosition)}
            ondelete = {() => viewState.saveGraph("ondelete")}
            deleteKey = {null}

            onnodedragstop = {()    => viewState.saveGraph("onnodedragstop")}

            onpanecontextmenu = {({ event })        => graphMenu.showPane(event, screenToFlowPosition)}
            onnodecontextmenu = {({ event, node })  => graphMenu.showNode(event, node)}
            onedgecontextmenu = {({ event, edge })  => graphMenu.showEdge(event, edge)}

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

            {#if showMiniMap}
                <MiniMap />
            {/if}

            <Background 
                variant={BackgroundVariant.Dots} 
                patternColor="rgba(255,255,255,0.5)"
                gap={20}/>
            
        </SvelteFlow>
    </SvelteFlowProvider>
</div>

<style>

    .graph-container
    {
        height : 100%;
    }
    
</style>