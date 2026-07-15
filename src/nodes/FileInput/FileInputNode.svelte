<script>

    import { getContext, onMount } from 'svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    import { isFilePath } from '$lib/svelte-obsidian/src/String.js';

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

    let nodeTitle = $derived(nodeState.targetName ? (isFilePath(nodeState.targetName) ? "📃 " : "📁 ") + nodeState.targetName : "🚫 File not selected");
    let isDragOver = $state(false);
    let isNotFound = $state(false);

    onMount(() => 
    {
        if (nodeState.targetPath) 
            renderHtml();

        appState.plugin.onFileModify.on(onFileModify);
        appState.plugin.onFileRename.on(onFileRename);
        appState.graph.getNodeContent[id] = getMessage;

        return () => 
        {
            appState.plugin.onFileModify.off(onFileModify);
            appState.plugin.onFileRename.off(onFileRename);
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
        const text = await nodeState.read(nodeState.targetPath);
        nodeState.parsePlaceholders(text);
        return text;
    }

    function onFileModify(file)
    {
        if (file.path === nodeState.targetPath)
            renderHtml();
    }

    function onFileRename(file, oldPath)
    {
        if (oldPath === nodeState.targetPath)
        {
            onFileChange(file);
            return;
        }

        let isChanged = false;
        let exclude = [...nodeState.exclude];

        for (let i = 0; i < exclude.length; i++)
        {
            if (exclude[i] === oldPath)
            {
                exclude[i] = file.path;
                isChanged = true;
            }
        }

        if (isChanged)
        {
            nodeState.exclude = exclude;
            onExcludeChange();
        }

        if (oldPath.indexOf(nodeState.targetPath) === 0)
            isChanged = true;

        if (isChanged)
            renderHtml();
    }

    function onFileChange(file)
    {
        appState.graph.updateNode(
            id, 
            {
                name : file.name, 
                path : file.path
            }, 
            "changeFileInput");

        nodeState.targetName = file.name;
        nodeState.targetPath = file.path;
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

    function onExcludeChange()
    {
        appState.graph.updateNode(
            id, 
            { exclude : nodeState.exclude }, 
            "excludeFileInput");
    }

    async function clickExclude(path, checked)
    {
        if (checked)
            nodeState.exclude = nodeState.exclude.filter(path2 => path2 != path);
        else
            nodeState.exclude = [...nodeState.exclude, path];

        onExcludeChange();
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

    async function handleDrop(e) 
    {
        e.preventDefault();
        isDragOver = false;

        const draggable = appState.app.dragManager.draggable;
        const file = draggable.file;

        if (!file) 
            return;

        if (file.extension &&
            !nodeState.supportedExtensions.includes(file.extension)) 
            return;

        onFileChange(file);
    }

    async function renderHtml()
    {
        isNotFound = false;

        if (!nodeState.targetPath)
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
                    aria-label={nodeState.targetPath || "Drag and drop some file here..."}>
                    {nodeTitle}
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
                        "{nodeState.targetPath}"
                    </error>
                {:else}
                    {#if nodeState.isFolder}
                        {#each nodeState.preview as item}
                            <card class={item.type}>
                                <div class="left" style="margin-left: {item.tabs}em;">

                                    {#if item.type === 'file'}
                                        <input 
                                            type="checkbox"
                                            aria-label="Include item"
                                            onchange={(e) => clickExclude(item.fullpath, e.target.checked)}
                                            checked={!nodeState.exclude.includes(item.fullpath)}> 
                                    {/if}
                                
                                    <div                                         
                                        aria-label={item.fullpath}>
                                        {item.icon} {item.name} 
                                    </div>
                                </div>
                                <div class="right">
                                    <div class="extension">{item.extension}</div>
                                </div>
                            </card>
                        {/each}
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
                {/if}

            </node-body>

        </node-content>
    </div>
</div>