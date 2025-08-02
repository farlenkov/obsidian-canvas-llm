<script>
    
    import { onMount } from 'svelte';
    import { Upload, Download, Settings, CircleHelp } from 'lucide-svelte';
    import { Controls, ControlButton } from '@xyflow/svelte';
    
    import graph from '$lib/graph/Graph.svelte.js';
    import settings from '$lib/overlay/Settings.svelte.js';
    
    let fileInput;

    function fileChange(event)
    {
        const file = event.target.files[0];

        if (!file) 
            throw "Invalid file";

        if (file.type != "application/json")
            throw "Invalid file";

        const reader = new FileReader();

        reader.onload = (e) => 
        { 
            const graphText = e.target.result.toString();
            const graphJson = JSON.parse(graphText);

            if (!Array.isArray(graphJson.nodes)) 
                throw "Invalid file";

            if (!Array.isArray(graphJson.edges)) 
                throw "Invalid file";

            graph.LoadFromFile(graphJson);
        };

        reader.readAsText(file);
    }
    
    function onclickExport() 
    {
        const jsonData = graph.Dump ();
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = "llm-graph.json"; 
        a.click();

        URL.revokeObjectURL(url);
    }

</script>

<input 
    type="file" 
    id="fileInput" 
    style="display: none;" 
    accept=".json"
    bind:this={fileInput}
    onchange={fileChange} />

<Controls 
    position={'top-left'}
    showFitView={false} 
    showLock={false} 
    showZoom={false}>
    <ControlButton on:click={() => fileInput.click()} title="Import" class={'canvas-llm-controll-button'}>
        <Upload size={24} />
    </ControlButton>
    <ControlButton on:click={onclickExport} title="Export" class={'canvas-llm-controll-button'}>
        <Download size={24} />
    </ControlButton>
    <ControlButton on:click={() => settings.Show()} title="Settings" class={'canvas-llm-controll-button'}>
        <Settings size={24} />
    </ControlButton>
</Controls>
