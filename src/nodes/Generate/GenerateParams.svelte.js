import GenericModal from '$lib/svelte-obsidian/src/GenericModal.js';
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
        this.appState.modelSelectState.ModelID = data.model || appState.settings.Data.defaultModel;
        this.appState.modelSelectState.ProviderID = data.provider || appState.settings.Data.defaultProvider;

        new GenericModal(
            this.appState, 
            GenerateParamsView, 
            ["svelte-obsidian", "canvas-llm", "canvas-llm-generate-params"])
            .open();
    }
}