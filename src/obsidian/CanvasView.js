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
        this.appState.graph.OnChange = () => this.requestSave();
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
        return this.appState.graph.ToString();
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