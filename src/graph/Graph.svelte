<script>
  
    import {
        SvelteFlow,
        Controls, 
        ControlButton, 
        Background,
        BackgroundVariant,
        MiniMap
    } from '@xyflow/svelte';

    import { MapIcon, Upload, Download, Settings, CircleHelp } from 'lucide-svelte';

    import graph from '$lib/graph/Graph.svelte.js';
    import contextMenu from '$lib/menu/ContextMenu.svelte.js';

    import MainMenu from '$lib/menu/MainMenu.svelte';
    import ContextMenu from '$lib/menu/ContextMenu.svelte';
    
    import TextInputNode from '$lib/nodes/TextInput/TextInputNode.svelte';
    import GenerateNode from '$lib/nodes/Generate/GenerateNode.svelte';

    import settings from '$lib/overlay/Settings.svelte.js';

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
            graph.RemovePrevEdge(connection);
            return;
        }
        
        await new Promise(res => setTimeout(res, 100));

        contextMenu.ShowConnect(event, connection);
    }

</script>
        <!-- colorMode = "dark" -->

<div 
    style:height="100%" 
    bind:clientWidth={contextMenu.CanvasWidth} 
    bind:clientHeight={contextMenu.CanvasHeight}>

    <SvelteFlow
        nodes = {graph.nodes}
        edges = {graph.edges}
        {nodeTypes}
        {zoomOnScroll}
        {preventScrolling}
        fitView
        fitViewOptions = {{maxZoom:1,minZoom:1}}
        proOptions = {{hideAttribution:true}}
        snapGrid = {[20,20]}
        onconnectstart = {() => contextMenu.Hide()}
        onconnectend={onConnectEnd}
        ondelete = {(event) => graph.OnChange()}
        
        on:paneclick = {() => contextMenu.Hide()}
        on:nodeclick = {() => contextMenu.Hide()}
        on:edgeclick = {() => contextMenu.Hide()}

        on:nodedragstart = {() => contextMenu.Hide()}
        on:nodedragstop = {() => graph.OnChange()}

        on:panecontextmenu = {({ detail : { event } })        => contextMenu.ShowPane(event)}
        on:nodecontextmenu = {({ detail : { event, node } })  => contextMenu.ShowNode(event, node)}
        on:edgecontextmenu = {({ detail : { event, edge } })  => contextMenu.ShowEdge(event, edge)}

        on:nodemousemove = {({ detail : { event }}) => {zoomOnScroll = (event.target.closest(".nozoom") == null)}}
        on:nodemouseleave = {() => {zoomOnScroll = true}}>

        <Controls position='bottom-left' orientation='horizontal'>
            <ControlButton on:click={() => showMiniMap = !showMiniMap} title="MiniMap" class={'canvas-llm-controll-button'}>
                <MapIcon size={24} />
            </ControlButton>
            <ControlButton on:click={() => settings.Show()} title="Settings" class={'canvas-llm-controll-button'}>
                <Settings size={24} />
            </ControlButton>
        </Controls>
        
        <ContextMenu />
        <!-- <MainMenu /> -->

        {#if showMiniMap}
            <MiniMap />
        {/if}

        <Background 
            variant={BackgroundVariant.Dots} 
            patternColor="rgba(255,255,255,0.5)"
            gap={20}/>
        
    </SvelteFlow>
</div>