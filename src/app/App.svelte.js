import GraphState from '$lib/graph/Graph.svelte.js';
import ContextMenuState from '$lib/menu/ContextMenu.svelte.js';
import GenerateParams from '$lib/nodes/Generate/GenerateParams.svelte.js';

import ModelSelectState from '$lib/svelte-llm/settings/ModelSelect.svelte.js';

import GenericModal from '$lib/svelte-obsidian/src/GenericModal.js';

import SettingsView from '$lib/svelte-llm/settings/Settings.svelte';
import settings from '$lib/svelte-llm/settings/Settings.svelte.js';

import providers from '$lib/svelte-llm/models/ProviderInfo.svelte.js';
import models from '$lib/svelte-llm/models/ModelInfo.svelte.js';

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
        this.modelSelectState = new ModelSelectState();
    }

    ShowSettings()
    {
        new GenericModal(
            this, 
            SettingsView, 
            ["canvas-llm", "canvas-llm-settings"])
            .open();
    }
}