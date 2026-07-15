import FileView from '$lib/svelte-obsidian/src/View.js';
import AppView from './View.svelte';

export default class ChatGptView extends FileView  
{
    static VIEW_TYPE = "chatgpt-view";
    static FILE_EXT = 'chatgpt';
    ROOT_CLASS = ['chatgpt', 'svelte-obsidian'];

    constructor(leaf, plugin) 
    {
        super(
            leaf, 
            plugin, 
            ChatGptView.VIEW_TYPE, 
            AppView);
    }
}