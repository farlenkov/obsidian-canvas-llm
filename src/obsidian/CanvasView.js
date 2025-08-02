import { Plugin, Modal, Notice, TextFileView, PluginSettingTab, Setting } from 'obsidian';
import { mount, unmount } from 'svelte'

import App from '$lib/App.svelte';
import graph from '$lib/graph/Graph.svelte.js';

export default class CanvasView extends TextFileView  
{
    constructor(leaf, plugin) 
    {
        super(leaf);
        this.plugin = plugin;

        const self = this;
        graph.OnChange = () => self.requestSave();
    }

    getViewType() 
    {
        return 'canvas-llm-view';
    }

    setViewData (fileContents, clear)
    {
        graph.LoadFromFile(JSON.parse(fileContents));

        if (this.graphView)
        {
            unmount(this.graphView);
            delete this.graphView;
        }
        
        const viewRoot = this.contentEl;
        viewRoot.classList.add('canvas-llm');
        viewRoot.empty();
        this.graphView = mount(App, { target: viewRoot });
    }

    getViewData ()
    {
        return JSON.stringify(graph.Dump());
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