import GraphState from '$lib/graph/Graph.svelte.js';
import ContextMenuState from '$lib/menu/ContextMenu.svelte.js';
import GenerateNodeParams from '$lib/nodes/Generate/GenerateNodeParams.svelte.js';

import settings from '$lib/overlay/Settings.svelte.js';
import providers from '$lib/models/ProviderInfo.svelte.js';
import models from '$lib/models/ModelInfo.svelte.js';

export default class AppState
{
    SettingsIsVisible = $state(false);

    constructor()
    {
        // GLOBAL

        this.settings = settings;
        this.providers = providers;
        this.models = models;

        // LOCAL

        this.graph = new GraphState();
        this.contextMenu = new ContextMenuState(),
        this.generateNodeParams = new GenerateNodeParams()
    }

    ShowSettings () 
    {
        this.SettingsIsVisible = true;
    }

    HideSettings ()
    {
        this.SettingsIsVisible = false;
    }
}