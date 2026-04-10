<script>

    import { getContext, onMount } from 'svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';

    import NodeState from './FileInputNode.svelte.js';
    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import TemplatingButton from '../Common/TemplatingButton.svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';
    import FileSelectModal from './FileSelectModal.js';

    const {id, data, selected} = $props();
    const appState = getContext("appState");
    const nodeState = new NodeState(id, data, appState, useUpdateNodeInternals());  

    let fileName = $state(data.name);
    let filePath = $state(data.path);
    let isDragOver = $state(false);
    let isNotFound = $state(false);

    onMount(() => 
    {
        if (filePath) 
            renderHtml();

        appState.plugin.onModify.push(onModify);
        appState.graph.getNodeContent[id] = getMessage;

        return () => 
        {
            appState.plugin.onModify = appState.plugin.onModify.filter(fn => fn !== onModify);
            delete appState.graph.getNodeContent[id];
        };
    });

    async function getMessage()
    {
        const text = await readFiles();
        return { role : "user", content : text };
    }

    async function readFiles()
    {
        const text = await nodeState.read(filePath);
        nodeState.parsePlaceholders(text);
        return text;
    }

    function onModify(file)
    {
        if (file.path === filePath)
            renderHtml();
    }

    function onFileChange(file)
    {
        appState.graph.updateNode(
            id, 
            { name : file.name, path : file.path }, 
            "FileInput");

        fileName = file.name;
        filePath = file.path;
        renderHtml();
    } 

    function onClickSelectFile ()
    {
        new FileSelectModal(
            appState.app, 
            nodeState.supportedExtensions,
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

        if (!nodeState.supportedExtensions.includes(file.extension)) 
            return;

        onFileChange(file);
    }

    async function renderHtml()
    {
        isNotFound = false;

        if (!filePath)
        {
            nodeState.parsePlaceholders("");
            return;
        }

        await readFiles();

        if (!nodeState.preview ||
            nodeState.preview.length == 0)
        {
            isNotFound = true;
            return;
        }
    }

</script>

<NodeResizer 
    minWidth={100} 
    minHeight={30}
    inputs={nodeState.allIns} />

<Handles inputs={nodeState.isTemplate ? nodeState.allIns : []} />

<div 
    class="canvas-node" 
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
                    <TemplatingButton {nodeState} />
                    <CopyTextButton {nodeState} />
                    <ParamsButton onclick={onClickSelectFile} label="Select file" />
                </node-header-right>

            </node-header>

            <node-body class="nodrag nozoom nomenu node-text markdown-rendered">

                {#if isNotFound}
                    <error>
                        File not found:
                        <br/>
                        "{filePath}"
                    </error>
                {:else}
                    {#if nodeState.preview.length === 1}
                        <MarkdownRenderer markdown={nodeState.preview[0]} />
                    {:else}
                        {#each nodeState.preview as text}
                            <card>
                                <MarkdownRenderer markdown={text} />
                            </card>
                        {/each}
                    {/if}
                {/if}

            </node-body>

        </node-content>
    </div>
</div>