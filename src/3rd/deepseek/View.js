import FileView from '$lib/svelte-obsidian/src/View.js';
import AppView from './View.svelte';

export default class DeepSeekView extends FileView  
{
    static VIEW_TYPE = "deepseek-view";
    static FILE_EXT = 'deepseek';
    ROOT_CLASS = ['deepseek', 'svelte-obsidian'];

    constructor(leaf, plugin) 
    {
        super(
            leaf, 
            plugin, 
            DeepSeekView.VIEW_TYPE, 
            AppView);
    }
}