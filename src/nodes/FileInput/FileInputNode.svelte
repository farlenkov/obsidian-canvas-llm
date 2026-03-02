<script>
  
    import { getContext, onMount } from 'svelte';
    import { MarkdownRenderer } from 'obsidian';
    import { Handle, Position, NodeResizer } from '@xyflow/svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import ParamsButton from '../Common/ParamsButton.svelte';
    import FileSelectModal from './FileSelectModal.js';
    import NodeTypes from '../Type/NodeTypes.js';

    const ALLOWED_EXTENSIONS = ['md', 'docx', 'fountain'];
    const appState = getContext("appState");
    const nodeType = NodeTypes.ById.fileInput;

    let {id, data, selected} = $props();
    let filePath = $state(data.path);
    let fileName = $state(data.name);
    let isDragOver = $state(false);
    let bodyEl;

    onMount(() => 
    {
        if (filePath) 
            renderHtml("onMount()"); 
    });

    function onFileChange(file)
    {
        fileName = file.name;
        filePath = file.path;

        renderHtml("onFileChange()");
        
        appState.graph.updateNode(
            id, 
            {path: file.path, name: file.name}, 
            "FileInput");
    } 

    function onClickSelectFile ()
    {
        new FileSelectModal(
            appState.app, 
            ALLOWED_EXTENSIONS,
            (file) => { onFileChange(file); })
            .open();
    }

    function handleDragOver(e) 
    {
        e.preventDefault();
        isDragOver = true;
    }

    function handleDragLeave() 
    {
        isDragOver = false;
    }

    function handleDrop(e) 
    {
        e.preventDefault();
        isDragOver = false;

        const raw = e.dataTransfer.getData('text/plain');
        
        if (!raw) 
            return;

        const url = new URL(raw);
        const fileUrl = url.searchParams.get('file');
        const filePath = decodeURIComponent(fileUrl);
        
        if (!filePath) 
            return;

        const file = 
            appState.app.vault.getAbstractFileByPath(filePath) ?? 
            appState.app.vault.getAbstractFileByPath(filePath + '.md');
        
        if (!file) 
            return;

        if (!ALLOWED_EXTENSIONS.includes(file.extension)) 
            return;

        onFileChange(file);
    }

    async function renderHtml(note)
    {
        if (!filePath)
            return;

        const text = await nodeType.getText(appState.app, filePath);

        if (!bodyEl)
            return;
        
        bodyEl.empty();
        
        if (!text)
            return;
        
        MarkdownRenderer.render(
            appState.app, 
            text, 
            bodyEl, 
            filePath, 
            appState.view);
    }

</script>

<NodeResizer 
    minWidth={100} 
    minHeight={30} 
    onResizeEnd={() => appState.graph.onChange("NodeResize")} />

<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />

<div 
    class="canvas-node" 
    class:is-selected={selected}
    class:drag-over={isDragOver}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}>

    <div class="canvas-node-container">      
        <node-content>
            <node-header>

                <node-header-left 
                    aria-label={filePath || "Drag and drop some file here..."}>
                    {fileName || "File not selected"}
                </node-header-left>
                
                <node-header-right>
                    <CopyTextButton nodeId={id} />
                    <ParamsButton onclick={onClickSelectFile} />
                </node-header-right>

            </node-header>

            <node-body class="nodrag nozoom nomenu node-text markdown-rendered">
                <div bind:this={bodyEl}></div>
            </node-body>

        </node-content>
    </div>
</div>

<style>
  
    .drag-over 
    {
        outline: 2px dashed var(--color-accent);
        border-radius: 0.5em;
    }

    node-header-left
    {
        overflow: hidden;
        text-overflow: ellipsis;
    }

</style>