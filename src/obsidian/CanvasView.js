import { TextFileView } from 'obsidian';
import { mount, unmount } from 'svelte'

import App from '$lib/app/App.svelte';
import AppState from '$lib/app/App.svelte.js';

export default class CanvasView extends TextFileView  
{
    constructor(leaf, plugin) 
    {
        super(leaf);

        this.plugin = plugin;
        this.appState = new AppState();

        this.appState.view = this;
        this.appState.plugin = plugin;
        this.appState.app = plugin.app;
        this.appState.leaf = plugin.leaf;

        this.appState.graph.onChange = () => this.requestSave();
    }

    getViewType() 
    {
        return 'canvas-llm-view';
    }

    async setViewData (fileContents, clear)
    {
        const graphJson = JSON.parse(fileContents);
        await this.appState.graph.loadFromFile(graphJson);
        
        this.unmountView();
        
        const viewRoot = this.contentEl;
        viewRoot.classList.add('canvas-llm', 'svelte-obsidian');
        viewRoot.empty();

        this.graphView = mount(App, 
        { 
            target : viewRoot, 
            props : { appState : this.appState } 
        });
    }

    getViewData()
    {
        return this.appState.graph.toString();
    }

    async onClose()
    {
        this.clear();
    }

    clear()
    {
        this.unmountView();

        const viewRoot = this.contentEl;
        viewRoot.classList.remove('canvas-llm', 'svelte-obsidian');
        viewRoot.empty();
    }

    unmountView()
    {
        if (this.graphView)
        {
            unmount(this.graphView);
            delete this.graphView;
        }
    }
}