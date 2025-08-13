<script>

    import { onDestroy } from 'svelte';
    import { RefreshCcw , RefreshCw, SquareArrowOutUpRight, XIcon  } from 'lucide-svelte';

    import params from './GenerateParams.svelte.js';
    import graph from '$lib/graph/Graph.svelte.js';
    import providers from '$lib/models/ProviderInfo.svelte.js';
    import models from '$lib/models/ModelInfo.svelte.js';
    import settings from '$lib/overlay/Settings.svelte.js';

    const RECENT_TAB = "recent";
    const FAVORITES_TAB = "favorites";

    let selectedProviderId = $state(params.ProviderTab || params.ProviderID);
    let selectedProvider = $derived(providers.ById[selectedProviderId]);
    let selectedProviderName = $derived(selectedProvider == null ? selectedProviderId : selectedProvider.name);
    let selectedProviderPrice = $derived(selectedProvider == null ? false : selectedProvider.price);
    
    let hasKey = $derived(settings.HasKey(selectedProviderId));
    let hasModels = $derived(settings.HasModels(selectedProviderId));
    let isSpecial = $derived(selectedProviderId == RECENT_TAB || selectedProviderId == FAVORITES_TAB);
    let isUpdating = $derived(models.Updating[selectedProviderId]);

    let errorMessage = $state();

    function clickProvider(providerId)
    {
        selectedProviderId = providerId;
        errorMessage = null;
    }

    function clickModel (model)
    {
        graph.UpdateNode(params.NodeID, {provider : model.providerId, model : model.id});
        params.ProviderTab = selectedProviderId;
        settings.AddRecentModel(model);
        params.Hide();
    }

    function checkFilter(model)
    {
        if (selectedProviderPrice && params.FilterFree)
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

    function getModelDesc(model)
    {
        const provider = providers.ById[model.providerId];
        return `[ ${provider.name} / ${model.owner} ] ${model.desc}`;
    }

    function getProviderName(model)
    {
        const provider = providers.ById[model.providerId];
        return `(${provider.name})`;
    }
    
    async function fetchModels()
    {
        errorMessage = null;
        errorMessage = await models.FetchModels(selectedProviderId);
    }

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
                        aria-label="Refresh models from {selectedProviderName}" 
                        onclick={fetchModels}>
                        <RefreshCcw size={16}/>  
                    </button>

                    <button 
                        class="clickable-icon" 
                        aria-label="Review models from {selectedProviderName}" 
                        disabled={isSpecial}
                        onclick={()=>{window.open(selectedProvider.models)}}>
                        <SquareArrowOutUpRight size={16}/>  
                    </button>

                </models-buttons>

                <input 
                    type=text 
                    class="models-filter-name inputbox2"
                    class:disabled={!isSpecial && (!hasKey || !hasModels)}
                    placeholder="Filter models by name"
                    disabled={!hasKey || !hasModels}
                    bind:value={params.FilterName}>

                <label 
                    class="models-filter-free"
                    class:disabled={!selectedProviderPrice || !hasKey || !hasModels}
                    aria-label="Show only free models">
                    <input 
                        type="checkbox" 
                        disabled={!selectedProviderPrice || !hasKey || !hasModels}
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
                        {#if !provider.untested}

                            <div onclick={()=>{clickProvider(provider.id)}} 
                                class="vertical-tab-nav-item"                            
                                class:is-active={provider.id == selectedProviderId}>
                                {provider.name}
                            </div>
                        {/if}
                    {/each}
                </div>
                
                <div class="vertical-tab-header-group-title">
                    Untested
                </div>
                <div class="vertical-tab-header-group-items">                    
                    {#each providers.List as provider}
                        {#if provider.untested}

                            <div onclick={()=>{clickProvider(provider.id)}} 
                                class="vertical-tab-nav-item"                            
                                class:is-active={provider.id == selectedProviderId}>
                                {provider.name}
                            </div>
                            
                        {/if}
                    {/each}
                </div>
                
                <div class="vertical-tab-header-group-title">
                    Your
                </div>
                <div class="vertical-tab-header-group-items">
                    
                    <div onclick={()=>{clickProvider(RECENT_TAB)}} 
                        class="vertical-tab-nav-item"                            
                        class:is-active={RECENT_TAB == selectedProviderId}>
                        Resent
                        <div class="vertical-tab-nav-item-chevron">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevron-right">
                                <path d="m9 18 6-6-6-6"></path>
                            </svg>
                        </div>
                    </div>

                </div>
            </div>  
                
        </div>

        <div class="vertical-tab-content-container">
            <div class="vertical-tab-content">
                <div class="vertical-tab-header-group">
                    <div class="vertical-tab-header-group-title">
                        Models from {selectedProviderName}
                    </div>
                    <div class="vertical-tab-header-group-items">

                        {#if !isSpecial && selectedProvider.untested}
                            <untested>
                                Access to this provider is implemented according to its documentation, but has not been tested by the developer of Canvas LLM. 
                                If you use it, please <a href="https://github.com/farlenkov/obsidian-canvas-llm/issues">share</a> your results with me.
                            </untested>
                        {/if}

                        {#if !isSpecial && !hasKey}
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
                            {#if !isSpecial && !hasModels}
                                <div style="padding: var(--size-4-1) var(--size-4-2);">
                                    List of models for <b>{selectedProvider.name}</b> not downloaded yet.
                                    <br>
                                    <div style="display: inline-block;">

                                        <button 
                                            style="margin-top: 1em;"
                                            disabled={isUpdating}
                                            onclick={fetchModels}>
                                            
                                            {#if isUpdating}
                                                Getting models...
                                            {:else}
                                                Get model list
                                            {/if}
                                        </button>

                                    </div>

                                    {#if errorMessage}
                                        <error style="margin-top: 1em;">
                                            {errorMessage}
                                            <button type="button" class="btn-dark" onclick={() => {errorMessage = null}}>
                                                <XIcon size={24} strokeWidth={2}/>
                                            </button>
                                        </error>
                                    {/if}
                                </div>
                            {:else}
                                {#if errorMessage}
                                    <error>
                                        {errorMessage}
                                        <button type="button" class="btn-dark" onclick={() => {errorMessage = null}}>
                                            <XIcon size={24} strokeWidth={2}/>
                                        </button>
                                    </error>
                                {/if}

                                {#each settings.GetModels(selectedProviderId) as model}
                                    {#if checkFilter(model)}
                                        <div onclick={()=>{clickModel(model)}} 
                                            class="vertical-tab-nav-item"
                                            aria-label="{getModelDesc(model)}"
                                            class:is-active={params.ModelID == model.id}>

                                            {#if (model.prompt + model.completion) != 0}
                                                {model.id}
                                            {:else}
                                                {model.id.replace(":free","")} 
                                                <label-free>free</label-free>
                                            {/if}

                                            {#if isSpecial}
                                                <label-provider>
                                                    {getProviderName(model)}
                                                </label-provider>
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

    .vertical-tab-header-group-items 
    {
        margin-bottom: 1.5em;
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

    label-provider
    {
        display: inline-block;
        opacity: 0.5;
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
    
    untested
    {
        display: block;
        border-left: 3px solid var(--color-blue);
        background-color: var(--background-secondary);
        margin-bottom: 0.5em;
        font-size: 0.8em;
        padding: 8px;
        border-radius: 4px;
    }

</style>