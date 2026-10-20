// import { Plugin } from 'obsidian';
import Plugin from '$lib/svelte-obsidian/src/Plugin.js';
import { defaultGraph } from '$lib/graph/Graph.default.js';
import { EventEmitter } from '$lib/svelte-obsidian/src/Event.js';
import { sleep, delay } from '$lib/svelte-obsidian/src/Async.js';
import SettingsState from '$lib/svelte-obsidian/src/Settings.svelte.js';

import nodeTypes from '$lib/nodes/Type/NodeTypes.js';
import llmSettings from '$lib/svelte-llm/settings/Settings.svelte.js';

import GraphState from '$lib/graph/Graph.svelte.js';
import CanvasView from '../graph/View.js';
import ClaudeView from '../3rd/claude/View.js';
import ChatGptView from '../3rd/chatgpt/View.js';
import DeepSeekView from '../3rd/deepseek/View.js';
import McpHost from '../svelte-llm/mcp/McpHost.js';

const MENU_ICON = 'workflow';

export default class MyPlugin extends Plugin 
{
    settings = new SettingsState();
    mcp = new McpHost();

    onFileModify = new EventEmitter();
    onFileRename = new EventEmitter();
    openedGraphs = {};

    async onload() 
    {    
        await this.settings.init(this);
        this.mcp.init(this);
        llmSettings.init(this);

        this.registerFileRenameHandler();
        this.registerFileModifyHandler();
        this.registerFileView(CanvasView);
        this.registerFileView(ClaudeView);
        this.registerFileView(ChatGptView);
        this.registerFileView(DeepSeekView);
        
        if (this.settings.Data.shortenFileTags)
            this.shortenFileTags();

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
        let batch = [];
        let timer;

        const fileRenameEvent = this.app.vault.on(
            'rename', 
            async (file, oldPath) => 
            {
                batch.push({file, oldPath, newPath : file.path});
                clearTimeout(timer);

                timer = delay(100, () => 
                {
                    this.batchRename(batch);
                    batch = [];
                });
            });

        this.registerEvent(fileRenameEvent);
    }

    async batchRename(batch)
    {
        const changedFiles = {};
        // console.log("batch", batch);
        
        const canvasFiles = this.app.vault
            .getFiles()
            .filter(f => f.extension === CanvasView.FILE_EXT);

        for (const renamed of batch)
        {
            if (this.openedGraphs[renamed.oldPath])
            {
                this.openedGraphs[renamed.newPath] = this.openedGraphs[renamed.oldPath];
                delete this.openedGraphs[renamed.oldPath];
            }

            for (const canvasFile of canvasFiles) 
            {            
                const canvas = changedFiles[canvasFile.path] 
                    ? changedFiles[canvasFile.path].content 
                    : JSON.parse(await this.app.vault.read(canvasFile));
                
                for (const node of canvas.nodes)
                {
                    const nodeType = nodeTypes.ById[node.type];

                    if (typeof nodeType.onFileRename === 'function')
                        if (nodeType.onFileRename(node, renamed.file, renamed.oldPath))
                            changedFiles[canvasFile.path] = { file : canvasFile, content : canvas };
                }                
            }
        }

        // console.log("changedFiles", changedFiles);

        for (const path in changedFiles)
        {
            const changed = changedFiles[path];
            const newText = JSON.stringify(changed.content, null, '\t');
            
            // console.log("save:", changed.file.path);
            await this.app.vault.modify(changed.file, newText);
        }
        
        this.onFileRename.emit(batch);

        for (const openedGraph of Object.values(this.openedGraphs))
            for (const nodeState of Object.values(openedGraph.nodeStates))
                if (nodeState.onFileRename)
                    nodeState.onFileRename(batch);
    }

    registerFileModifyHandler()
    {
        const fileModifyEvent = this.app.vault.on(
            'modify', 
            async (file) =>
            {
                this.onFileModify.emit(file);

                for (const openedGraph of Object.values(this.openedGraphs))
                    for (const nodeState of Object.values(openedGraph.nodeStates))
                        if (nodeState.onFileModify)
                            nodeState.onFileModify(file);

                const modifiedGraph = this.openedGraphs[file.path];

                if (!modifiedGraph)
                    return;
                
                if (modifiedGraph.isModified)
                {
                    delete modifiedGraph.isModified;
                    return;
                }

                const text = await this.app.vault.read(file);
                // console.log("load:", file.path);
                modifiedGraph.loadFromFile(text);
            });

        this.registerEvent(fileModifyEvent);
    }

    onFileOpen(file)
    {
        if (this.openedGraphs[file.path])
            this.openedGraphs[file.path].viewCount++;
    }

    onFileClose(file)
    {
        if (file)
            if (this.openedGraphs[file.path])
                this.openedGraphs[file.path].viewCount--;
    }

    getGraph(file, fileText)
    {
        if (this.openedGraphs[file.path])
            return this.openedGraphs[file.path];

        const graph = new GraphState(file, this);
        this.openedGraphs[file.path] = graph;
        graph.loadFromFile(fileText);

        return graph;
    }

    shortenFileTags()
    {
        const EXT = '.canvas-llm';
        const SHORT = 'llm';
        const observed = new WeakSet();

        const hookExplorers = () =>
        {
            for (const leaf of this.app.workspace.getLeavesOfType('file-explorer')) 
            {
                const container = leaf.view.containerEl;
                
                if (observed.has(container)) 
                    continue;

                observed.add(container);

                const observer = new MutationObserver(() => shortenTags(container));
                observer.observe(container, { childList: true, subtree: true });
                this.register(() => observer.disconnect());

                shortenTags(container);
            }
        }

        const shortenTags = (container) =>
        {
            const tags = container.querySelectorAll(`.nav-file-title[data-path$="${EXT}"] .nav-file-tag`);
            
            for (const el of tags)
                if (el.textContent !== SHORT) 
                    el.textContent = SHORT;
        }

        this.app.workspace.onLayoutReady(() => 
        {
            hookExplorers();
            this.registerEvent( this.app.workspace.on('layout-change', () => hookExplorers()) );
        });
    }
}