import GraphState from '$lib/graph/Graph.svelte.js';
import ContextMenuState from '$lib/menu/ContextMenu.svelte.js';
import GenerateParams from '$lib/nodes/Generate/GenerateParams.svelte.js';

import settings from '$lib/settings/Settings.svelte.js';
import providers from '$lib/models/ProviderInfo.svelte.js';
import models from '$lib/models/ModelInfo.svelte.js';

export default class AppState
{
    constructor()
    {
        // GLOBAL

        this.settings = settings;
        this.providers = providers;
        this.models = models;

        // LOCAL

        this.graph = new GraphState();
        this.contextMenu = new ContextMenuState(),
        this.generateParams = new GenerateParams(this)
    }

    ShowSettings()
    {
        this.settings.Show(this);
    }
}