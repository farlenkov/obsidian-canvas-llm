import { Plugin, normalizePath, loadPdfJs } from 'obsidian';
import * as obsidian from 'obsidian';
import CanvasView from './CanvasView.js';
import settings from '$lib/svelte-llm/settings/Settings.svelte.js';
import { defaultGraph } from '$lib/graph/Graph.default.js';
import { createNewFile } from '$lib/svelte-obsidian/src/CreateNewFile.js';

const FILE_EXT = 'canvas-llm';

export default class CanvasPlugin extends Plugin 
{
    async onload() 
    {
        settings.Init(this);

        this.RegisterCanvasView();
        this.RegisterMenuItem();
        this.RegisterFileRenameHandler();

        this.addRibbonIcon(
            'workflow', 
            'Create new Canvas LLM', 
            () => { this.CreateNewCanvas("/"); });
    }

    async onunload() 
    {
        
    }

    async RegisterCanvasView()
    {
        this.registerExtensions(
            [FILE_EXT], 
            'canvas-llm-view');

        this.registerView(
            'canvas-llm-view',
            (leaf) => new CanvasView(leaf, this));
    }

    async RegisterMenuItem()
    {
        const fileMenuEvent = this.app.workspace.on(
            'file-menu', 
            (menu, menuFile) => 
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

        this.registerEvent(fileMenuEvent);
    }

    RegisterFileRenameHandler()
    {
        const fileRenameEvent = this.app.vault.on(
            'rename', 
            async (file, oldPath) => 
            {
                console.log('rename', oldPath, file.path);
                // Находим все свои файлы, которые ссылаются на oldPath
                // const myFiles = this.app.vault.getFiles().filter(f => f.extension === FILE_EXT);
                
                // for (const myFile of myFiles) 
                // {
                //     const content = await this.app.vault.read(myFile);
                    
                //     if (content.includes(oldPath)) 
                //     {
                //         const newContent = content.replaceAll(oldPath, file.path);
                //         await this.app.vault.modify(myFile, newContent);
                //     }
                // }
            });

        this.registerEvent(fileRenameEvent);
    }

    async CreateNewCanvas(folderPath)
    {
        const graph = defaultGraph();

        await createNewFile(
            this.app, 
            folderPath,
            "Canvas LLM",
            FILE_EXT,
            graph);
    }
}