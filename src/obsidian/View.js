import { TextFileView } from 'obsidian';
import { mount, unmount } from 'svelte'

import App from '$lib/app/App.svelte';
import AppState from '$lib/app/App.svelte.js';

export default class CanvasView extends TextFileView  
{
    static VIEW_TYPE = "canvas-llm-view";
    static FILE_EXT = 'canvas-llm';

    constructor(leaf, plugin) 
    {
        super(leaf);

        this.plugin = plugin;
        this.appState = new AppState();

        this.appState.view = this;
        this.appState.plugin = plugin;
        this.appState.app = plugin.app;
        this.appState.leaf = plugin.leaf;

        this.appState.graph.onChange.on(() => this.requestSave());
    }

    getViewType() 
    {
        return CanvasView.VIEW_TYPE;
    }

    async setViewData (fileContents, clear)
    {
        const graphJson = JSON.parse(fileContents);
        await this.appState.graph.loadFromFile(graphJson);
        
        this.unmountView();
        
        const viewRoot = this.contentEl;
        viewRoot.classList.add('canvas-llm', 'svelte-obsidian');
        viewRoot.empty();

        this.appView = mount(App, 
        { 
            target : viewRoot, 
            props : { appState : this.appState } 
        });
    }

    getViewData()
    {
        return this.appState.graph.toString();
    }

    // onload() // Override this to load your component
    // {
    //     console.log("onload", this);
    // }
    
    // onunload() // Override this to unload your component
    // {
    //     console.log("onunload", this);
    // }

    async onClose() // Override
    {
        // console.log("onClose", this);
        this.plugin.onFileClose(this.file);
        this.clear();
    }

    async onLoadFile(file)
    {
        // console.log("onLoadFile", this, file);
        super.onLoadFile(file);
        this.plugin.onFileOpen(file);

    }
    async onUnloadFile(file)
    {
        // console.log("onUnloadFile", this, file);
        super.onUnloadFile(file);
        this.plugin.onFileClose(file);
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
        if (this.appView)
        {
            unmount(this.appView);
            delete this.appView;
        }
    }
}