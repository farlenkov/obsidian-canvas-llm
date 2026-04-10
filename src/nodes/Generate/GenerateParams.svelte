<script>

    import ModelSelect from '$lib/svelte-llm/settings/ModelSelect.svelte';

    const { appState, modal } = $props();

    function onModelSelected(model)
    {
        appState.graph.updateNode(
            appState.generateParams.NodeID, 
            {provider : model.providerId, model : model.id}, 
            "ModelChange");
        
        appState.settings.AddRecentModel(model);
        modal.close();
    }

</script>

<ModelSelect
    onModelSelected={onModelSelected}
    onShowSettings={() => appState.showSettings()}
    modelSelectState={appState.modelSelectState} />