<script>

	import { getContext, onMount } from 'svelte';
    import { Play, Loader, XIcon, Lightbulb } from 'lucide-svelte';
    import { Handle, Position, NodeResizer } from '@xyflow/svelte';
    import { MarkdownRenderer } from 'obsidian';
    
    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';

    import aiClient from '$lib/svelte-llm/models/AiClient.svelte.js';

    const appState = getContext("appState");
    let bodyEl;

    let {id, data, selected} = $props();
    let inProgress = $state(false);
    let errorMessage = $state("");
    let activeTab = $state(data.part ?? 0);
    let hasThink = $state(false);
    let showThink = $state(false);
    let provider = $derived(appState.providers.ById[data.provider]);
    let model = $derived(provider ? provider.ModelById[data.model] : null);
    
    onMount(() => 
    { 
        renderHtml(
            "onMount()",
            data.results); 
    });
    
    function getModelDesc()
    {
        if (model)
            return `[ ${provider.name} / ${model.owner} ] ${model.desc}`;
        else
            return `[ ${data.provider} ] ${data.model}`;
    }

    async function clickGenerate()
    {
        errorMessage = "";
        
        if (!data.model)
        {
            showParams();
            return;
        }

        if (!model)
        {
            showParams()
            return;
        }

        if (!appState.settings.HasKey(provider.id))
        {
            appState.ShowSettings();
            return;
        }
        
        inProgress = true;

        try
        {
            const nodes = await appState.graph.getPrompt(id, appState.app);

            if (nodes.length == 0)
                throw "Prompt is empty. Please connect some Input node.";
            
            const { markdowns } = await aiClient.Call(data.provider, data.model, nodes);
            const oldResults = data.results.filter(md => md ? true : false);

            const result = 
            { 
                provider : data.provider, 
                model : data.model,
                text : markdowns[0]
            };

            if (markdowns.length > 1)
                result.think = markdowns[1];

            const update = 
            {
                part : oldResults.length,
                results : [...oldResults, result]
            };

            appState.graph.updateNode(id, update, "TextGenerate");
            activeTab = update.part;

            renderHtml(
                "clickGenerate()", 
                update.results);
        }
        catch (err)
        {
            errorMessage = err;
        }

        inProgress = false;
    }

    function showParams()
    {
        appState.generateParams.Show(id, data);
    }

    function clickNextPart()
    {
        const nextPart = (activeTab + 1) % data.results.length;
        data.part = nextPart;
        activeTab = nextPart;
        showThink = false;

        appState.graph.onChange("NextPart");

        renderHtml(
            "clickNextPart()",
            data.results);
    }

    function getSwitchPartLabel()
    {
        return `Switch part (${activeTab + 1}/${data.results.length}) \n ${data.results[activeTab].model}`;
    }

    function renderHtml(note, results)
    {
        bodyEl.empty();

        if (!results)
            return;

        if (results.length <= activeTab)
            return;

        const result = results[activeTab];
        const text = showThink ? result.think : result.text;
        hasThink = result.think ? true : false;

        MarkdownRenderer.render(
            appState.app, 
            text, 
            bodyEl, 
            appState.view.file.path, 
            appState.view);
    }

</script>

<NodeResizer 
    minWidth={100} 
    minHeight={30} 
    onResizeEnd={() => appState.graph.onChange("NodeResize")} />

<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />

<div class="canvas-node" class:is-selected={selected}>
    <div class="canvas-node-container">

        <node-content>
            <node-header>
                <node-header-left>
                    {#if data.model}
                        <div aria-label="{getModelDesc()}">
                            {data.model}
                        </div>
                    {:else}
                        Generate
                    {/if}
                </node-header-left>

                <node-header-right>
                    {#if hasThink}
                        {#if !showThink}
                            <button 
                                class="show-think clickable-icon"
                                aria-label="Show reasoning"
                                onclick={() => showThink = true}>
                                <Lightbulb size={16}/>
                            </button>
                        {:else}
                            <button 
                                class="show-think clickable-icon color-text-accent"
                                aria-label="Show message"
                                onclick={() => showThink = false}>
                                <Lightbulb size={16}/>
                            </button>
                        {/if}
                    {/if}

                    {#if data.results?.length > 1}
                        <button 
                            class="next-part"
                            aria-label={getSwitchPartLabel()}
                            onclick={clickNextPart}>
                            {activeTab + 1}
                        </button>
                    {/if}

                    {#if !inProgress}
                        <button class="call-llm mod-cta" aria-label="Call LLM" onclick={clickGenerate}>
                            <Play size={16}/>  
                        </button>
                    {:else}
                        <button class="call-llm mod-cta" aria-label="In progress..." disabled>
                            <Loader size={16} class="rotate"/> 
                        </button>
                    {/if}

                    <CopyTextButton nodeId={id} copyThink={showThink} />
                    <ParamsButton onclick={showParams} />
                </node-header-right>

            </node-header>

            <node-body class="nodrag nozoom nomenu node-text markdown-rendered">

                <div bind:this={bodyEl}></div>

                {#if errorMessage}
                    <error>
                        {errorMessage}
                        <button type="button" class="btn-dark" onclick={() => {errorMessage = ""}}>
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