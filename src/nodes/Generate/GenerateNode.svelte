<script>

    import { Play, Loader, XIcon } from 'lucide-svelte';
    import { Handle, Position, NodeResizer, useNodeConnections } from '@xyflow/svelte';
    
    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';

    import settings from '$lib/overlay/Settings.svelte.js';
    import graph from '$lib/graph/Graph.svelte.js';
    import providers from "$lib/models/ProviderInfo.svelte.js"
    import models from '$lib/models/ModelInfo.svelte.js';
    import aiClient from '$lib/models/AiClient.svelte.js';
    import { mdToHtml } from '$lib/utils/Markdown.js';
    import params from './GenerateParams.svelte.js';

    let {id, data, selected} = $props();
    let inProgress = $state(false);
    let errorMessage = $state("");
    let activeTab = $state(data.part ?? 0);

    async function clickGenerate()
    {
        errorMessage = "";
        
        if (!data.model)
        {
            showParams();
            return;
        }

        const provider = providers.ById[data.provider];
        const model = provider.ModelById[data.model];

        if (!model)
        {
            showParams()
            return;
        }

        if (!settings.HasKey(provider.id))
        {
            settings.Show();
            return;
        }
        
        inProgress = true;

        try
        {
            const nodes = graph.GetPrompt(id);
            const { markdowns, htmls } = await aiClient.Call(data.provider, data.model, nodes);
            graph.UpdateNode(id, { markdowns, htmls, part : 0 });
        }
        catch (err)
        {
            console.error("[GenerateNode > Exec]", data.provider, data.model, err);
            errorMessage = err;
        }

        inProgress = false;
    }

    function clickTab(tabNum)
    {
        data.part = tabNum;
        activeTab = tabNum;
        graph.OnChange();
    }

    function showParams()
    {
        if (!data.provider || !data.model)
            params.Show(id, settings.Data.defaultProvider, settings.Data.defaultModel);
        else
            params.Show(id, data.provider, data.model);
    }

</script>

<NodeResizer 
    minWidth={100} 
    minHeight={30} 
    onResizeEnd={() => graph.OnChange()} />

<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />

<div class="canvas-node" class:is-selected={selected}>
    <div class="canvas-node-container">

        <node-content class:has-tabs={data.markdowns.length > 1}>
            <node-header>
                <node-header-left>
                    {#if data.model}
                        {data.model}
                    {:else}
                        Generate
                    {/if}
                </node-header-left>

                <node-header-right>
                    {#if !inProgress}
                        <button class="mod-cta" aria-label="Call LLM" onclick={clickGenerate}>
                            <Play size={16}/>  
                        </button>
                    {:else}
                        <button class="mod-cta" aria-label="In progress..." disabled>
                            <Loader size={16} class="rotate"/> 
                        </button>
                    {/if}
                    <CopyTextButton text={data.markdowns[activeTab]} />
                    <ParamsButton onclick={showParams} />
                </node-header-right>

            </node-header>

            {#if data.markdowns.length > 1}
                <tabs>
                    {#each data.markdowns as markdown, i}
                        <button 
                            class:active={activeTab == i} 
                            onclick={() => clickTab(i)}>Part {i + 1}</button>
                    {/each}
                </tabs>
            {/if}

            <node-body class="nodrag nozoom nomenu node-text markdown-rendered">
                {#if data.markdowns.length == 1}
                    {@html mdToHtml(data.markdowns[0])}
                {:else}
                    {@html mdToHtml(data.markdowns[activeTab])}
                {/if}

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

  tabs
  {
    display: flex;
    border-bottom: 1px solid #aaa;

    button
    {
      padding: 0.1em 1em; 
    }
    
    button:hover
    {
      background: #ffffff1f; 
    }

    button.active
    {
      background: #575757;
    }
  }

  node-header-right .btn-main { margin-right: 0.5em;}

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
    }
  }

</style>