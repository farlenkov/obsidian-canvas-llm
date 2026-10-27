<script>

	import { getContext, onMount } from 'svelte';
    import { Play, Loader, XIcon, Lightbulb } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    
    import { showConfirmMenu } from '$lib/svelte-obsidian/src/Menu.js';
    import ModelSelect from '$lib/svelte-llm/model-select/ModelSelect.svelte';
    import Modal from '$lib/svelte-obsidian/src/Modal.js';

    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';
    import VersionButton from '../Common/VersionsButton.svelte';
    import HeadingsButton from '../Common/HeadingsButton.svelte';
    import EditTitle from '../Common/EditTitle.js';

    const { id } = $props();
    const viewState = getContext("viewState");
    const nodeState = viewState.graph.getNodeState(id);  

    let bodyEl;

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

        if (nodeState.results?.length > 0)
        {
            // if (nodeState.results.length > 1)
            // {
            //     menu.push
            //     ({
            //         title : `Edit generation`,
            //         icon : "square-pen",
            //         disabled : nodeState.inProgress,
            //         onclick : () => startEdit()
            //     });
            // }

            contextItems.push
            ({
                title : `Delete version (${nodeState.activeTab + 1}/${nodeState.results.length})`,
                class : "is-danger",
                icon : "square-x",
                onclick : (event) => 
                {
                    showConfirmMenu(`Delete version (${nodeState.activeTab + 1}/${nodeState.results.length})?`, event, () => 
                    {
                        nodeState.deleteResult(nodeState.activeTab);
                        saveResults();
                    });
                }
            });
            
            if (nodeState.results.length > 1)
            {
                contextItems.push
                ({
                    title : `Delete all versions (${nodeState.results.length})`,
                    class : "is-danger",
                    icon : "copy-x",
                    onclick : (event) => 
                    {
                        showConfirmMenu(`Delete all versions (${nodeState.results.length})?`, event, () => 
                        {
                            nodeState.clearResults();
                            saveResults();
                        });
                    }
                });
            }
        }

        return contextItems;
    };

    function getParamsMenu()
    {
        const paramsMenu = 
        [{
            title : "Select model",
            icon : "bot",
            onclick : () => showParams()
        }];

        paramsMenu.push(new EditTitle(viewState, nodeState));
        return paramsMenu;
    }

    async function getMessage()
    {
        const result = nodeState.getCurrentResult();
        return { role : "assistant", content : result?.text ?? "" };        
    }

    // function startEdit()
    // {
    //     nodeState.startEdit();
    //     saveEdit();
    // }

    // function saveEdit()
    // {        
    //     viewState.updateNode(
    //         nodeState.id,
    //         { 
    //             editId : nodeState.editId,
    //             edit   : nodeState.editText,
    //         },
    //         "editDialogueMessage");
    // }

    function setVersion(num)
    {
        nodeState.setVersion(num);
        refreshHeadings();

        viewState.updateNode(
            nodeState.id,
            { part : nodeState.activeTab },
            "NextPart");
    }

    async function clickGenerate()
    {
        nodeState.errorMessage = "";

        if (!nodeState.model)
        {
            showParams();
            return;
        }

        if (!viewState.settings.HasKey(nodeState.provider.id))
        {
            viewState.showSettings();
            return;
        }

        await nodeState.generate();
        saveResults();
    }

    function saveResults()
    {
        refreshHeadings();

        viewState.updateNode(
            nodeState.id, 
            {
                part : nodeState.activeTab,
                results : nodeState.results
            }, 
            "TextGenerate");
    }
    
    function getModelDesc()
    {
        if (nodeState.model)
        {
            if (nodeState.model.owner)
                return `${nodeState.modelId}\n\n[ ${nodeState.provider.name} / ${nodeState.model.owner} ] ${nodeState.model.desc}`;
            else
                return `${nodeState.modelId}\n\n[ ${nodeState.provider.name} ] ${nodeState.model.desc}`;
        }
        else
        {
            return `[ ${nodeState.providerId} ] ${nodeState.modelId}`;
        }
    }

    function showParams()
    {
        const modal = new Modal(
            ModelSelect, 
            {
                app : viewState.app,
                state : nodeState.modelSelect,
                modelId : nodeState.modelId,
                providerId : nodeState.providerId,
                onShowSettings : () => viewState.showSettings(),

                onModelSelected : model => 
                {
                    viewState.updateNode(
                        nodeState.id, 
                        {
                            provider : model.providerId, 
                            model : model.id
                        }, 
                        "ModelChange");
                    
                    nodeState.modelId = model.id;
                    nodeState.providerId = model.providerId;
                    viewState.settings.AddRecentModel(model);
                    modal.close();
                }
            }, 
            [
                "svelte-obsidian", 
                "canvas-llm", 
                "svelte-llm-model-select"
            ]);

        modal.open();
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
    minHeight={30} />

<Handles />

<div class="canvas-node">
    <div class="canvas-node-container">

        <node-content>
            <node-header>
                <node-header-left>
                    {nodeState.showIcon ? "✨" : ""}
                    {#if nodeState.modelId}
                        <div aria-label="{getModelDesc()}">
                            {nodeState.title || nodeState.modelId}
                        </div>
                    {:else}
                        {nodeState.title || "Generate"}
                    {/if}
                </node-header-left>

                <node-header-right>

                    <HeadingsButton 
                        {bodyEl}
                        app={viewState.app}
                        class="clickable-icon"
                        onclick={clickHeader}
                        refresh={refreshHeadings} />

                    {#if nodeState.hasThink}
                        {#if !nodeState.showThink}
                            <button 
                                class="show-think clickable-icon"
                                aria-label="Show reasoning"
                                onclick={() => nodeState.toggleThink(true)}>
                                <Lightbulb size={16}/>
                            </button>
                        {:else}
                            <button 
                                class="show-think clickable-icon color-text-accent"
                                aria-label="Show message"
                                onclick={() => nodeState.toggleThink(false)}>
                                <Lightbulb size={16}/>
                            </button>
                        {/if}
                    {/if}

                    {#if nodeState.results?.length > 1}
                        <VersionButton 
                            app={viewState.app}
                            onclick={setVersion}
                            class="clickable-icon"
                            versions={nodeState.results}
                            versionNum={nodeState.activeTab} />
                    {/if}

                    {#if !nodeState.inProgress}
                        <button class="call-llm mod-cta" aria-label="Call LLM" onclick={clickGenerate}>
                            <Play size={16}/>  
                        </button>
                    {:else}
                        <button class="call-llm mod-cta" aria-label="In progress..." disabled>
                            <Loader size={16} class="rotate"/> 
                        </button>
                    {/if}

                    <CopyTextButton {nodeState} copyThink={nodeState.showThink} />
                    <ParamsButton onclick={showParams} {viewState} {nodeState} {getParamsMenu} />
                </node-header-right>
            </node-header>

            <node-body class="nodrag nozoom nomenu node-text markdown-rendered" bind:this={bodyEl}>

                <MarkdownRenderer markdown={nodeState.textToRender} />

                {#if nodeState.errorMessage}
                    <error>
                    
                        {nodeState.errorMessage}

                        <button type="button" class="btn-dark" onclick={() => {nodeState.errorMessage = ""}}>
                            <XIcon size={24} strokeWidth={2}/>
                        </button>
                    </error>
                {/if}

            </node-body>
        </node-content>

    </div>
</div>

<style>

  error
  {
    position: fixed;
    top: 2.05em;
    left: 1px;
    right: 1px;
  }

  node-header-right .mod-cta
  {
    padding: var(--size-4-1) var(--size-4-2);
  }

</style>