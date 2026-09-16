<script>

	import { getContext, onMount } from 'svelte';
    import { Play, Loader, XIcon, Lightbulb, FileXCorner } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    
    import Modal from '$lib/svelte-obsidian/src/Modal.js';
    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';
    import ModelSelect from '$lib/svelte-llm/settings/ModelSelect.svelte';

    const { id } = $props();
    const viewState = getContext("viewState");
    const nodeState = viewState.graph.getNodeState(id);  

    const contextItems =
    [{
        label : "CLEAR GENERATIONS",
        class : "is-warning",
        icon : FileXCorner,
        callback : () => 
        {
            nodeState.clearResults();
            saveResults();
        }
    }];
    
    onMount(() => 
    { 
        const updateNodeInternals = useUpdateNodeInternals();
        nodeState.updateNodeInternals.add(updateNodeInternals);
        viewState.graph.getNodeContent[id] = getMessage;
        viewState.contextItems[id] = contextItems;

        return () =>
        {
            nodeState.updateNodeInternals.del(updateNodeInternals);
            delete viewState.graph.getNodeContent[id];
            delete viewState.contextItems[id];
        };
    });

    async function getMessage()
    {
        if (!nodeState.results ||
            nodeState.results.length === 0)
            return { role : "assistant", content : "" };

        const result = nodeState.results[nodeState.activeTab || 0];
        const text = result.text;
        return { role : "assistant", content : text };
    }

    function clickNextPart()
    {
        nodeState.nextPart();

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
            return `[ ${nodeState.provider.name} / ${nodeState.model.owner} ] ${nodeState.model.desc}`;
        else
            return `[ ${nodeState.providerId} ] ${nodeState.modelId}`;
    }

    function showParams()
    {
        const modal = new Modal(
            ModelSelect, 
            {
                app : viewState.app,
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

    function getSwitchPartLabel()
    {
        return `Switch part (${nodeState.activeTab + 1}/${nodeState.results.length}) \n ${nodeState.results[nodeState.activeTab].model}`;
    }

    // function renderHtml(results)
    // {
    //     if (nodeState.results.length <= nodeState.activeTab)
    //     {
    //         nodeState.textToRender = "";
    //         return;
    //     }

    //     const result = nodeState.results[nodeState.activeTab];
    //     nodeState.textToRender = nodeState.showThink ? result.think : result.text;
    //     nodeState.hasThink = result.think ? true : false;
    // }

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
                    {#if nodeState.modelId}
                        <div aria-label="{getModelDesc()}">
                            {nodeState.modelId}
                        </div>
                    {:else}
                        Generate
                    {/if}
                </node-header-left>

                <node-header-right>
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
                        <button 
                            class="next-part"
                            aria-label={getSwitchPartLabel()}
                            onclick={clickNextPart}>
                            {nodeState.activeTab + 1}
                        </button>
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
                    <ParamsButton onclick={showParams} />
                </node-header-right>

            </node-header>

            <node-body class="nodrag nozoom nomenu node-text markdown-rendered">

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

  button.next-part
  {
    padding: var(--size-4-1) var(--size-4-2);
  }

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