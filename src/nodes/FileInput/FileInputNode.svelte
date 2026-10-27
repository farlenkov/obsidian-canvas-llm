<script>

    import { getContext, onMount } from 'svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    import { isFilePath } from '$lib/svelte-obsidian/src/String.js';
    import { showConfirmMenu } from '$lib/svelte-obsidian/src/Menu.js';

    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import TemplatingButton from '../Common/TemplatingButton.svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import HeadingsButton from '../Common/HeadingsButton.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';
    import FileSelectModal from '$lib/svelte-obsidian/src/FileSelectModal.js';
    import EditTitle from '../Common/EditTitle.js';
    import TemplatingMenuItem from '../Common/TemplatingMenuItem.js';

    const { id } = $props();
    const viewState = getContext("viewState");
    const nodeState = viewState.graph.getNodeState(id);
    let bodyEl;

    let isDragOver = $state(false);
    let nodeIcon = $derived(!nodeState.targetName ? "❌ " : (isFilePath(nodeState.targetName) ? "📃 " : "📁 "));
    let nodeTitle = $derived(nodeState.title || nodeState.targetName || "File not selected");

    $effect(() => 
    {
        nodeState.preview.toString();
        refreshHeadings();
    });

    onMount(() => 
    {
        const updateNodeInternals = useUpdateNodeInternals();
        nodeState.updateNodeInternals.add(updateNodeInternals);
        viewState.graph.nodeContent.add(id, getMessage);
        viewState.contextItems.add(id, getHeadMenu);

        return () => 
        {
            nodeState.updateNodeInternals.del(updateNodeInternals);
            viewState.graph.nodeContent.del(id, getMessage);
            viewState.contextItems.del(id, getHeadMenu);
        };
    });

    function getHeadMenu ()
    {
        const contextItems = 
        [
            // new EditTitle(
            //     viewState, 
            //     nodeState)
        ];

        if (nodeState.targetPath)
        {
            contextItems.push
            ({
                title : `Reset node`,
                class : "is-danger",
                icon : "square-x",
                onclick : (event) => 
                {
                    showConfirmMenu("Reset node?", event, () => 
                    {
                        onFileChange();
                    });
                }
            });
        }

        return contextItems;
    };

    function getParamsMenu()
    {
        const paramsMenu = 
        [{
            title : "Select file",
            icon : "file-search-corner",
            onclick : () => onClickSelectFile()
        }];

        if (nodeState.targetPath)
        {
            paramsMenu.push
            ({
                title : "Show file",
                icon : "square-arrow-up-left",
                onclick : () => 
                {
                    const item = viewState.app.vault.getAbstractFileByPath(nodeState.targetPath);
                    const explorer = viewState.app.workspace.getLeavesOfType("file-explorer")[0];

                    if (explorer) 
                    {
                        explorer.view.revealInFolder(item);
                        viewState.app.workspace.revealLeaf(explorer);
                    }
                }
            });
        }
                    
        paramsMenu.push(new TemplatingMenuItem(viewState, nodeState));
        paramsMenu.push(new EditTitle(viewState, nodeState));
        return paramsMenu;
    }

    async function getMessage()
    {
        const text = await readFiles();
        return { role : "user", content : text };
    }

    async function readFiles()
    {
        const text = await nodeState.readTargetFiles();
        return text;
    }

    function onFileChange(file)
    {
        viewState.updateNode(
            id, 
            {
                name : file?.name, 
                path : file?.path
            }, 
            "changeFileInput");

        nodeState.targetName = file?.name;
        nodeState.targetPath = file?.path;
        readFiles();
        // refreshHeadings();
    } 

    function onClickSelectFile ()
    {
        new FileSelectModal(
            viewState.app, 
            nodeState.supportedExtensions,
            (file) => { onFileChange(file); })
            .open();
    }

    function onExcludeChange()
    {
        viewState.updateNode(
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

        const draggable = viewState.app.dragManager.draggable;
        const file = draggable.file;

        if (!file) 
            return;

        if (file.extension &&
            !nodeState.supportedExtensions.includes(file.extension)) 
            return;

        onFileChange(file);
    }

    function clickHeader(el)
    {
        bodyEl.scrollTo
        ({
            behavior: 'smooth',
            top: el.offsetTop
        });
    }

    function refreshHeadings(callback)
    {
        if (callback)
            refreshHeadings.callback = callback;
        else
            refreshHeadings.callback?.();
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

                <node-header-left aria-label={nodeState.targetPath || "Drag and drop some file or folder here..."}>
                    {nodeState.showIcon ? nodeIcon : ""} {nodeTitle}
                </node-header-left>

                <node-header-right>

                    {#if !nodeState.isFolder && !nodeState.isNotFound}
                        <HeadingsButton 
                            {bodyEl}
                            app={viewState.app}
                            class="clickable-icon"
                            onclick={clickHeader}
                            target={nodeState.targetPath}
                            refresh={refreshHeadings} />
                    {/if}

                    <!-- <TemplatingButton {nodeState} {viewState} /> -->
                    <CopyTextButton {nodeState} />
                    <ParamsButton onclick={onClickSelectFile} {viewState} {nodeState} {getParamsMenu} />
                </node-header-right>

            </node-header>

            <node-body
                bind:this={bodyEl} 
                class="nodrag nozoom nomenu node-text markdown-rendered">

                {#if nodeState.isNotFound}
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