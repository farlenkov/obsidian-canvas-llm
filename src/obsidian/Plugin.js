// import { Plugin } from 'obsidian';
import Plugin from '$lib/svelte-obsidian/src/Plugin.js';
import { defaultGraph } from '$lib/graph/Graph.default.js';
import { EventEmitter } from '$lib/svelte-obsidian/src/Event.js';
import { sleep } from '$lib/svelte-obsidian/src/Async.js';
import nodeTypes from '$lib/nodes/Type/NodeTypes.js';
import settings from '$lib/svelte-llm/settings/Settings.svelte.js';

import CanvasView from './View.js';
import ClaudeView from '../3rd/claude/View.js';
import ChatGptView from '../3rd/chatgpt/View.js';
import DeepSeekView from '../3rd/deepseek/View.js';

const MENU_ICON = 'workflow';

export default class MyPlugin extends Plugin 
{
    onFileModify = new EventEmitter();
    onFileRename = new EventEmitter();
    openedFiles = {};

    async onload() 
    {
        settings.Init(this);

        this.registerFileRenameHandler();
        this.registerFileModifyHandler();
        this.registerFileView(CanvasView);
        this.registerFileView(ClaudeView);
        this.registerFileView(ChatGptView);
        this.registerFileView(DeepSeekView);

        this.registerMenuItem(
            'New Canvas LLM',
            MENU_ICON,
            "Canvas LLM",
            CanvasView.FILE_EXT,
            defaultGraph);

        this.addRibbonIcon(
            MENU_ICON, 
            'Create new Canvas LLM', 
            () => 
            { 
                this.createNewFile(
                    "/",
                    "Canvas LLM",
                    CanvasView.FILE_EXT,
                    defaultGraph);
             });
    }

    registerFileRenameHandler()
    {
        const fileRenameEvent = this.app.vault.on(
            'rename', 
            async (file, oldPath) => 
            {
                await sleep(100);

                if (this.openedFiles[oldPath])
                {
                    this.openedFiles[file.path] = this.openedFiles[oldPath];
                    delete this.openedFiles[oldPath];
                }

                this.onFileRename.emit(file, oldPath);

                const canvasFiles = this.app.vault
                    .getFiles()
                    .filter(f => f.extension === CanvasView.FILE_EXT);
                
                for (const canvasFile of canvasFiles) 
                {
                    if (this.openedFiles[canvasFile.path])
                        continue;
                    
                    const text = await this.app.vault.read(canvasFile);
                    const canvas = JSON.parse(text);
                    let isChanged = false;

                    for (const node of canvas.nodes)
                    {
                        const nodeType = nodeTypes.ById[node.type];

                        if (typeof nodeType.onFileRename === 'function')
                            isChanged = nodeType.onFileRename(node, file, oldPath) || isChanged;
                    }

                    if (isChanged)
                    {
                        console.log(`[rename] '${canvasFile.path}'`);
                        const newText = JSON.stringify(canvas, null, '\t');
                        await this.app.vault.modify(canvasFile, newText);
                    }
                }
            });

        this.registerEvent(fileRenameEvent);
    }

    registerFileModifyHandler()
    {
        const fileModifyEvent = this.app.vault.on(
            'modify', 
            (file) => this.onFileModify.emit(file));

        this.registerEvent(fileModifyEvent);
    }

    onFileOpen(file)
    {
        if (this.openedFiles[file.path])
            this.openedFiles[file.path]++;
        else
            this.openedFiles[file.path] = 1;

        console.log("open", this.openedFiles[file.path], file.path);
    }

    onFileClose(file)
    {
        if (this.openedFiles[file.path])
            this.openedFiles[file.path]--;

        console.log("close", this.openedFiles[file.path], file.path);
    }
}