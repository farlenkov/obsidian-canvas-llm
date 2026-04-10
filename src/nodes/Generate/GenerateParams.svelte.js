import Modal from '$lib/svelte-obsidian/src/Modal.js';
import GenerateParamsView from '$lib/nodes/Generate/GenerateParams.svelte';

export default class GenerateParams
{
    NodeID = $state(0);
    FilterName = $state("");
    FilterFree = $state(false);

    constructor(appState)
    {
        this.appState = appState;
    }

    Show (nodeId, data) 
    {
        this.NodeID = nodeId;
        
        this.appState.modelSelectState.ModelID = 
            data.model || 
            this.appState.settings.Data.defaultModel;
        
        this.appState.modelSelectState.ProviderID = 
            data.provider || 
            this.appState.settings.Data.defaultProvider;

        new Modal(
            GenerateParamsView, 
            {appState : this.appState}, 
            [
                "svelte-obsidian", 
                "canvas-llm", 
                "svelte-llm-model-select-container"
            ])
            .open();
    }
}