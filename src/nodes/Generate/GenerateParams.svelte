<script>

    import { onDestroy } from 'svelte';
    import { RefreshCcw , RefreshCw, SquareArrowOutUpRight  } from 'lucide-svelte';

    import params from './GenerateParams.svelte.js';
    import graph from '$lib/graph/Graph.svelte.js';
    import providers from '$lib/models/ProviderInfo.svelte.js';
    import models from '$lib/models/ModelInfo.svelte.js';
    import settings from '$lib/overlay/Settings.svelte.js';

    let selectedProvider = $state(providers.ById[params.ProviderID]);
    let hasKey = $derived(settings.HasKey(selectedProvider.id));
    let hasModels = $derived(settings.HasModels(selectedProvider.id));
    let isUpdating = $derived(models.Updating[selectedProvider.id]);
    let fetchError = $derived(models.Errors[selectedProvider.id]);

    function clickProvider(providerId)
    {
        selectedProvider = providers.ById[providerId];
    }

    function clickModel (modelId)
    {
        graph.UpdateNode(params.NodeID, {provider : selectedProvider.id, model : modelId});
        params.Hide();
    }

    function checkFilter(model)
    {
        if (selectedProvider.price && params.FilterFree)
        {
            // if (typeof model.prompt !== 'number')
            //     return false;

            // if (typeof model.completion !== 'number')
            //     return false;

            if ((model.prompt + model.completion) != 0)
                return false;
        }

        let nameFilter = params.FilterName.trim();

        if (nameFilter && 
            model.id.toLowerCase().indexOf(nameFilter.toLowerCase()) < 0)
            return false;
        
        return true;
    }

    onDestroy(() => 
    {
		models.ResetErrors();
	});

</script>

<div class='modal mod-sidebar-layout'>

    <div class="modal-close-button" onclick={() => params.Hide()}></div>

    <div style="position: absolute; top:0; left:0; right:0; height:3em">
        <div style="position: relative;width: 100%;height: 100%;">
            <models-filter>

                <models-buttons>

                    <button 
                        class="clickable-icon" 
                        class:disabled={isUpdating || !hasKey}
                        disabled={isUpdating || !hasKey}
                        aria-label="Refresh models from {selectedProvider.name}" 
                        onclick={()=>{models.FetchModels(selectedProvider.id)}}>
                        <RefreshCcw size={16}/>  
                    </button>

                    <button 
                        class="clickable-icon" 
                        aria-label="Review models from {selectedProvider.name}" 
                        onclick={()=>{window.open(selectedProvider.models)}}>
                        <SquareArrowOutUpRight size={16}/>  
                    </button>

                </models-buttons>

                <input 
                    type=text 
                    class="models-filter-name inputbox2"
                    class:disabled={!hasKey || !hasModels}
                    placeholder="Filter models by name"
                    disabled={!hasKey || !hasModels}
                    bind:value={params.FilterName}>

                <label 
                    class="models-filter-free"
                    class:disabled={!selectedProvider.price || !hasKey || !hasModels}
                    aria-label="Show only free models">
                    <input 
                        type="checkbox" 
                        disabled={!selectedProvider.price || !hasKey || !hasModels}
                        bind:checked={params.FilterFree}> Free
                </label>


            </models-filter>
            
        </div>
    </div>
        
    <div class="modal-content vertical-tabs-container">

        <div class="vertical-tab-header">
            <div class="vertical-tab-header-group">
                <div class="vertical-tab-header-group-title">
                    API Providers
                </div>
                <div class="vertical-tab-header-group-items">
                    
                     {#each providers.List as provider}
                        <div onclick={()=>{clickProvider(provider.id)}} 
                            class="vertical-tab-nav-item"                            
                            class:is-active={provider.id == selectedProvider.id}>
                            {provider.name}
                            <div class="vertical-tab-nav-item-chevron">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevron-right">
                                    <path d="m9 18 6-6-6-6"></path>
                                </svg>
                            </div>
                        </div>
                    {/each}
                    
                </div>
            </div>
        </div>

        <div class="vertical-tab-content-container">
            <div class="vertical-tab-content">
                <div class="vertical-tab-header-group">
                    <div class="vertical-tab-header-group-title">
                        Models from {selectedProvider.name}
                    </div>
                    <div class="vertical-tab-header-group-items">                        
                        {#if !hasKey}
                            <div style="padding: var(--size-4-1) var(--size-4-2);">
                                You did not provide the API key for <b>{selectedProvider.name}</b>.
                                <br>
                                <br>
                                You can get API key here:
                                <br>
                                <a href="{selectedProvider.keys}" target="_blank" title="Get API Key">
                                    {selectedProvider.keys}
                                </a>
                                <br>
                                <br>
                                And paste your API key in settings:
                                <br>
                                <div style="display: inline-block;">
                                    <button 
                                        style="margin-top: 0.6em;"
                                        onclick={()=>{settings.Show()}}>
                                        Open Settings
                                    </button>
                                </div>
                            </div>
                        {:else}
                            {#if !hasModels}
                                <div style="padding: var(--size-4-1) var(--size-4-2);">
                                    List of models for <b>{selectedProvider.name}</b> not downloaded yet.
                                    <br>
                                    <div style="display: inline-block;">

                                        <button 
                                            style="margin-top: 1em;"
                                            disabled={isUpdating}
                                            onclick={()=>{models.FetchModels(selectedProvider.id)}}>
                                            
                                            {#if isUpdating}
                                                Getting models...
                                            {:else}
                                                Get model list
                                            {/if}
                                        </button>

                                    </div>

                                    {#if fetchError}
                                        <error>
                                            {fetchError}
                                            <button type="button" class="btn-dark" onclick={() => {models.ResetErrors()}}>
                                                <XIcon size={24} strokeWidth={2}/>
                                            </button>
                                        </error>
                                    {/if}
                                </div>
                            {:else}
                                {#each settings.GetModels(selectedProvider.id) as model}
                                    {#if checkFilter(model)}
                                        <div onclick={()=>{clickModel(model.id)}} 
                                            class="vertical-tab-nav-item"
                                            class:is-active={params.ModelID == model.id}>
                                            
                                            {#if (model.prompt + model.completion) != 0}
                                                {model.id}
                                            {:else}
                                                {model.id.replace(":free","")} 
                                                <label-free>free</label-free>
                                            {/if}
                                                
                                            <!-- <div class="vertical-tab-nav-item-chevron">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"></path></svg>
                                            </div> -->
                                        </div>
                                    {/if}
                                {/each}
                            {/if}
                        {/if}                        
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>

    .modal-close-button
    {
        z-index: 1;
    }

    .modal-content
    {
        padding-top: 3em;
        padding-bottom: 1em;
        height: 100%;
    }

    .vertical-tab-content
    {
        padding: var(--size-4-3);
    }

    .vertical-tab-header,
    .vertical-tab-header-group,
    .vertical-tab-content
    {
        padding-top: 0;
        padding-bottom: 0;
    }
    
    .vertical-tab-content-container
    {
        margin-top: 0;
    }

    .vertical-tab-header-group
    {
        padding-top: 0;
    }

    .modal
    {
        width:      var(--modal-width);
        height:     var(--modal-height);

        max-width:  48em;
        max-height: 40em;
    }

    label-free
    {
        display: inline-block;
        font-size: 0.9em;
        background-color: green;
        color: white;
        padding: 0 0.25em;
    }

    models-filter
    {
        display:flex;
        justify-content: center;
        align-items: center;
        gap: 1.5em;

        padding: 0.2em 05em;
        width: 100%;
        height: 100%;
        position: relative;

        input[type="text"].models-filter-name
        {
            width: 16.5em;
            height: 1.75em;
            text-align: center;
        }

        .models-filter-free
        {
            display: flex;
            align-items: center;
        }
    }

    models-buttons
    {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0;

        button
        {
            padding: 0.5em;
        }
    }

</style>