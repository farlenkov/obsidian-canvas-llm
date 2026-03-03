import { Plugin } from 'obsidian';
import * as obsidian from 'obsidian';
import CanvasView from './CanvasView.js';
import settings from '$lib/svelte-llm/settings/Settings.svelte.js';
import { defaultGraph } from '$lib/graph/Graph.default.js';
import { createNewFile } from '$lib/svelte-obsidian/src/CreateNewFile.js';

const FILE_EXT = 'canvas-llm';

export default class CanvasPlugin extends Plugin 
{
    onModify = [];

    async onload() 
    {
        settings.Init(this);

        this.RegisterCanvasView();
        this.RegisterMenuItem();
        this.RegisterFileRenameHandler();
        this.RegisterFileModifyHandler();

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
                const canvasFiles = this.app.vault
                    .getFiles()
                    .filter(f => f.extension === FILE_EXT);
                
                for (const canvasFile of canvasFiles) 
                {
                    const text = await this.app.vault.read(canvasFile);
                    
                    if (text.includes(oldPath)) 
                    {
                        const canvas = JSON.parse(text);

                        for (const node of canvas.nodes)
                        {
                            if (node.data?.path === oldPath)
                            {
                                node.data.path = file.path;
                                node.data.name = file.name;
                            }
                        }

                        const newText = JSON.stringify(canvas, null, '\t');
                        await this.app.vault.modify(canvasFile, newText);
                    }
                }
            });

        this.registerEvent(fileRenameEvent);
    }

    RegisterFileModifyHandler()
    {
        const fileModifyEvent = this.app.vault.on(
            'modify', 
            (file) => 
            {
                for (const callback of this.onModify)
                    callback(file);
            });

        this.registerEvent(fileModifyEvent);
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