<script>

	import { getContext, onMount } from 'svelte';
    import { Play, Loader, XIcon } from 'lucide-svelte';
    import { Handle, Position, NodeResizer } from '@xyflow/svelte';
    import { MarkdownRenderer } from 'obsidian';
    
    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';

    import aiClient from '$lib/models/AiClient.svelte.js';

    const appState = getContext("appState");
    let bodyEl;
    
    let {id, data, selected} = $props();
    let inProgress = $state(false);
    let errorMessage = $state("");
    let activeTab = $state(data.part ?? 0);

    let provider = $derived(appState.providers.ById[data.provider]);
    let model = $derived(provider ? provider.ModelById[data.model] : null);

    onMount(async () => { renderHtml(); });

    $effect(() => { renderHtml(); });
    
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
            const nodes = appState.graph.getPrompt(id);

            if (nodes.length == 0)
                throw "Prompt is empty. Please connect some Input node.";
            
            const { markdowns } = await aiClient.Call(data.provider, data.model, nodes);
            const oldMarkdowns = data.markdowns.filter(md => md ? true : false);

            const update = 
            {
                part : oldMarkdowns.length,
                markdowns : [...oldMarkdowns, ...markdowns]
            };

            appState.graph.updateNode(id, update, "TextGenerate");
            activeTab = update.part;
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
        const nextPart = (activeTab + 1) % data.markdowns.length;
        data.part = nextPart;
        activeTab = nextPart;
        appState.graph.onChange("NextPart");
    }

    function renderHtml()
    {
        bodyEl.empty();

        if (data.markdowns.length <= activeTab)
            return;

        const markdown = data.markdowns[activeTab];

        MarkdownRenderer.render(
            appState.app, 
            markdown, 
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
                    {#if data.markdowns.length > 1}
                        <button 
                            class="next-part"
                            aria-label="Switch part ({activeTab + 1}/{data.markdowns.length})" 
                            onclick={clickNextPart}>
                            {activeTab + 1}
                        </button>
                    {/if}

                    {#if !inProgress}
                        <button class="mod-cta" aria-label="Call LLM" onclick={clickGenerate}>
                            <Play size={16}/>  
                        </button>
                    {:else}
                        <button class="mod-cta" aria-label="In progress..." disabled>
                            <Loader size={16} class="rotate"/> 
                        </button>
                    {/if}

                    <CopyTextButton nodeId={id} />
                    <ParamsButton onclick={showParams} />
                </node-header-right>

            </node-header>

            <node-body class="nodrag nozoom nomenu node-text markdown-rendered">
                <!-- {#if data.markdowns.length > 0}
                    {@html mdToHtml(data.markdowns[activeTab])}
                {/if} -->
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

  node-header-right .btn-main { margin-right: 0.5em;}

  button.next-part
  {
    padding: var(--size-4-1) var(--size-4-2);
    margin-right: 0.25em;
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

  node-header-right
  {
    .mod-cta
    {
      margin-right: 0.5em;
      padding: var(--size-4-1) var(--size-4-2);
    }
  }

</style>