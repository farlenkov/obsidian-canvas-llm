import CanvasModal from '$lib/obsidian/CanvasModal.js';
import GenerateParamsView from '$lib/nodes/Generate/GenerateParams.svelte';

export default class GenerateParams
{
    NodeID = $state(0);
    ModelID = $state("");
    ProviderID = $state("");
    ProviderTab = $state("");

    FilterName = $state("");
    FilterFree = $state(false);

    constructor(appState)
    {
        this.appState = appState;
    }

    Show (nodeId, data) 
    {
        if (!data.provider || !data.model)
        {
            this.ModelID = appState.settings.Data.defaultModel;
            this.ProviderID = appState.settings.Data.defaultProvider;
        }
        else
        {
            this.ModelID = data.model;
            this.ProviderID = data.provider;
        }

        this.NodeID = nodeId;
        new CanvasModal(this.appState, GenerateParamsView, "generate-params").open();
    }
}