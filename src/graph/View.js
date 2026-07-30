import Modal from '$lib/svelte-obsidian/src/Modal.js';
import FileView from '$lib/svelte-obsidian/src/View.js';
import ContextMenuState from '$lib/menu/ContextMenu.svelte.js';

import SettingsView from '$lib/svelte-llm/settings/Settings.svelte';
import settings from '$lib/svelte-llm/settings/Settings.js';

import providers from '$lib/svelte-llm/models/ProviderInfo.js';
import models from '$lib/svelte-llm/models/ModelInfo.js';

import Graph from '$lib/graph/Graph.svelte';

export default class CanvasView extends FileView // https://docs.obsidian.md/Reference/TypeScript+API/TextFileView
{
    static VIEW_TYPE = "canvas-llm-view";
    static FILE_EXT = 'canvas-llm';
    ROOT_CLASS = ["canvas-llm", 'svelte-obsidian'];

    constructor(leaf, plugin) 
    {
        super(
            leaf,
            plugin,
            CanvasView.VIEW_TYPE,
            Graph);

        // GLOBAL

        this.settings = settings;
        this.providers = providers;
        this.models = models;

        // LOCAL

        this.contextMenu = new ContextMenuState();
    }

    showSettings()
    {
        new Modal(
            SettingsView, 
            { viewState : this }, 
            ["canvas-llm", "canvas-llm-settings"])
            .open();
    }

    updateNode (id, update, source)
    {
        this.graph.updateNode(id, update);
        this.saveGraph(source);
    }

    saveGraph(source)
    {
        this.graph.onChange.emit(source);
        this.requestSave();
    }

    // OVERRIDE

    setViewData (fileContents, clear)
    {
        if (clear)
        {
            this.graph = this.plugin.getGraph(this.file, fileContents);
            this.unmountView();
            this.mountView(this.graph);
        }
    }

    getViewData()
    {
        this.graph.isModified = true;
        return this.graph.toString();
    }

    async onClose()
    {
        this.plugin.onFileClose(this.file);
        await super.onClose();
    }

    async onLoadFile(file)
    {
        super.onLoadFile(file);
        this.plugin.onFileOpen(file);
    }

    async onUnloadFile(file)
    {
        super.onUnloadFile(file);
        this.plugin.onFileClose(file);
    }
}