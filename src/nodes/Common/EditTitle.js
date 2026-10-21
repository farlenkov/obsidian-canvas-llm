import Modal from '$lib/svelte-obsidian/src/Modal.js';
import View from './EditTitle.svelte'

export default class EditTitle
{
    title = "Edit title";
    icon = "square-pen";

    constructor(viewState, nodeState)
    {
        this.app = viewState.app;
        this.viewState = viewState;
        this.nodeState = nodeState;
    }
            
    onclick()
    {
        new Modal(
            View, 
            {
                app : this.app, 
                nodeState : this.nodeState,
                viewState : this.viewState,
            }, 
            [
                "svelte-obsidian", 
                "canvas-llm", 
                "canvas-llm-node-title-edit"
            ])
            .open();
    }
}