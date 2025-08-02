import { Plugin, Modal, Notice, TextFileView, PluginSettingTab, Setting } from 'obsidian';

import CanvasView from './CanvasView.js';
import CanvasSetting from './CanvasSetting.js';
import settings from '$lib/overlay/Settings.svelte.js';
import creteDefaultGraph from '$lib/graph/Graph.default.js';

export default class CanvasPlugin extends Plugin 
{
    async onload() 
    {
        const self = this;
        settings.Init(this);
        this.RegisterCanvasView();
        this.RegisterMenuItem();

        this.addRibbonIcon(
            'workflow', 
            'Create new Canvas LLM', 
            () => { this.CreateNewCanvas("/"); });

        // this.addSettingTab(new CanvasSetting(this.app, this));
    }

    async RegisterCanvasView()
    {
        this.registerExtensions(
            ['canvas-llm'], 
            'canvas-llm-view');

        this.registerView(
            'canvas-llm-view',
            (leaf) => 
            {
                self.canvasView = new CanvasView(leaf, this);
                return self.canvasView;
            });
    }

    async RegisterMenuItem()
    {
        const ev = this.app.workspace.on('file-menu', (menu, menuFile) => 
        {
            if (menuFile.extension === undefined) 
            { 
                menu.addItem((item) => 
                {
                    item.setTitle('New Canvas LLM')
                        .setIcon('workflow') 
                        .onClick(async () =>
                        {
                            this.CreateNewCanvas(menuFile.path);
                        });
                });
            }
        });

        this.registerEvent(ev);
    }

    async CreateNewCanvas(folderPath)
    {
        let counter = 0;
        let baseName = "Canvas LLM"
        let filePath = `${folderPath}/${baseName}.canvas-llm`;
        
        while (await this.app.vault.adapter.exists(filePath)) 
        {
            counter++;
            filePath = `${folderPath}/${baseName} ${counter}.canvas-llm`;
        }

        const file = await this.app.vault.create(
            filePath, 
            JSON.stringify(creteDefaultGraph()));

        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(file);
    }

    async onunload() 
    {
        
    }
}