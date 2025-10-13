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

        this.appState.graph.OnChange = () =>
        {
            if (!this.saveRequested)
            {
                this.saveRequested = true;
                this.requestSave();
            }
        };
    }

    getViewType() 
    {
        return 'canvas-llm-view';
    }

    async setViewData (fileContents, clear)
    {
        const graphJson = JSON.parse(fileContents);
        await this.appState.graph.LoadFromFile(graphJson);

        if (this.graphView)
        {
            unmount(this.graphView);
            delete this.graphView;
        }
        
        const viewRoot = this.contentEl;
        viewRoot.classList.add('canvas-llm');
        viewRoot.empty();

        this.graphView = mount(App, 
        { 
            target: viewRoot, 
            props : {appState : this.appState} 
        });
    }

    getViewData ()
    {
        const data = this.appState.graph.ToString();
        this.saveRequested = false;
        return data;
    }

    clear ()
    {
        if (this.graphView)
        {
            unmount(this.graphView);
            delete this.graphView;
        }

        const viewRoot = this.contentEl;
        viewRoot.classList.remove('canvas-llm');
        viewRoot.empty();
    }
}