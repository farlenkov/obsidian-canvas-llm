import FileView from '$lib/svelte-obsidian/src/View.js';
import AppView from './View.svelte';

export default class ClaudeView extends FileView  
{
    static VIEW_TYPE = "claude-view";
    static FILE_EXT = 'claude';
    ROOT_CLASS = ['claude', 'svelte-obsidian'];

    constructor(leaf, plugin) 
    {
        super(
            leaf, 
            plugin, 
            ClaudeView.VIEW_TYPE, 
            AppView);
    }
}