<script>

	import { getContext, onMount } from 'svelte';
    import { Play, Loader, XIcon, Lightbulb } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    
    import Modal from '$lib/svelte-obsidian/src/Modal.js';
    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';
    import ParamsView from './GenerateParams.svelte';

    const { id } = $props();
    const viewState = getContext("viewState");
    const nodeState = viewState.graph.getNodeState(id);  
    
    onMount(() => 
    { 
        const updateNodeInternals = useUpdateNodeInternals();
        nodeState.updateNodeInternals.add(updateNodeInternals);
        viewState.graph.getNodeContent[id] = getMessage;

        // renderHtml(data.results);

        return () =>
        {
            nodeState.updateNodeInternals.del(updateNodeInternals);
            delete viewState.graph.getNodeContent[id];
        };
    });

    async function getMessage()
    {
        if (!nodeState.results ||
            nodeState.results.length === 0)
            return { role : "assistant", content : "" };

        const result = nodeState.results[nodeState.activeTab || 0];
        const text = result.text; // getThink ? result.think : result.text;
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
            console.log("clickGenerate", nodeState);
            showParams();
            return;
        }

        if (!viewState.settings.HasKey(nodeState.provider.id))
        {
            viewState.showSettings();
            return;
        }

        await nodeState.generate();
        
        const update = 
        {
            part : nodeState.activeTab,
            results : nodeState.results
        };

        viewState.updateNode(nodeState.id, update, "TextGenerate");
        // renderHtml(update.results);
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
        // viewState.generateParams.Show(nodeState);

        new Modal(
            ParamsView, 
            {
                viewState, 
                nodeState
            }, 
            [
                "svelte-obsidian", 
                "canvas-llm", 
                "svelte-llm-model-select-container"
            ])
            .open();
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

  node-header-left
  {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  node-header-right .mod-cta
  {
    padding: var(--size-4-1) var(--size-4-2);
  }

</style>