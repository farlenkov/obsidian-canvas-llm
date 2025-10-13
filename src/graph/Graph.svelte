<script>
  
    import {
        SvelteFlow,
        Controls, 
        ControlButton, 
        Background,
        BackgroundVariant,
        MiniMap
    } from '@xyflow/svelte';

    import { getContext } from 'svelte';
    import { MapIcon, Settings } from 'lucide-svelte';

    import ContextMenu from '$lib/menu/ContextMenu.svelte';
    import TextInputNode from '$lib/nodes/TextInput/TextInputNode.svelte';
    import GenerateNode from '$lib/nodes/Generate/GenerateNode.svelte';

    const appState = getContext("appState");

    const nodeTypes = 
    {
        textInput : TextInputNode,
        generate : GenerateNode
    }
    
    let showMiniMap = $state(false);
    let zoomOnScroll = $state(true);
    let preventScrolling = $derived(zoomOnScroll);

    async function onConnectEnd(event, connection) 
    {
        if (connection.isValid) 
        {
            appState.graph.RemovePrevEdge(connection);
            return;
        }
        
        await sleep(100);
        appState.contextMenu.ShowConnect(event, connection);
    }

</script>

<div 
    class="graph-container" 
    bind:clientWidth={appState.contextMenu.CanvasWidth} 
    bind:clientHeight={appState.contextMenu.CanvasHeight}>

    <SvelteFlow
        bind:nodes = {appState.graph.nodes}
        bind:edges = {appState.graph.edges}
        {nodeTypes}
        {zoomOnScroll}
        {preventScrolling}
        fitView
        fitViewOptions = {{maxZoom:1,minZoom:1}}
        proOptions = {{hideAttribution:true}}
        snapGrid = {[20,20]}
        onconnectstart = {() => appState.contextMenu.Hide()}
        onconnectend = {onConnectEnd}
        ondelete = {(event) => appState.graph.OnChange()}
        
        onpaneclick = {() => appState.contextMenu.Hide()}
        onnodeclick = {() => appState.contextMenu.Hide()}
        onedgeclick = {() => appState.contextMenu.Hide()}

        onnodedragstart = {()   => appState.contextMenu.Hide()}
        onnodedragstop = {()    => appState.graph.OnChange()}

        onpanecontextmenu = {({ event })        => appState.contextMenu.ShowPane(event)}
        onnodecontextmenu = {({ event, node })  => appState.contextMenu.ShowNode(event, node)}
        onedgecontextmenu = {({ event, edge })  => appState.contextMenu.ShowEdge(event, edge)}

        onnodepointermove   = {({event}) => { zoomOnScroll = event.target.closest(".nozoom") == null }}
        onnodepointerleave  = {() => { zoomOnScroll = true }}>

        <Controls position='bottom-left' orientation='horizontal'>
            <ControlButton onclick={() => showMiniMap = !showMiniMap} title="MiniMap" class={'canvas-llm-controll-button'}>
                <MapIcon size={24} />
            </ControlButton>
            <ControlButton onclick={() => appState.ShowSettings()} title="Settings" class={'canvas-llm-controll-button'}>
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