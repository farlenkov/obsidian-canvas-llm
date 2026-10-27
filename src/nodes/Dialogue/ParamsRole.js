import Modal from '$lib/svelte-obsidian/src/Modal.js';
import ModelSelect from '$lib/svelte-llm/model-select/ModelSelect.svelte';

export default class ParamsRole
{
    constructor(nodeState, viewState, role)
    {
        this.nodeState = nodeState; 
        this.viewState = viewState; 
        this.role = role;
    }

    save()
    {
        this.viewState.updateNode(
            this.nodeState.id,
            { roles : this.nodeState.roles },
            "changeDialogueRole");

        this.nodeState.updateNodeTooltip();
        this.nodeState.updateAllowSteps();
        this.nodeState.updateHandles();
    }

    openModelSelect()
    {
        const modal = new Modal(
            ModelSelect, 
            {
                app : this.viewState.app,
                state : this.nodeState.modelSelect,
                modelId : this.role.model,
                providerId : this.role.provider,
                onShowSettings : () => this.viewState.showSettings(),
                
                onModelSelected : model => 
                {
                    this.role.bot = true;
                    this.role.model = model.id;
                    this.role.provider = model.providerId;

                    this.save();
                    modal.close();
                }
            }, 
            [
                "svelte-obsidian", 
                "canvas-llm", 
                "svelte-llm-model-select"
            ]);

        modal.open();
    }
}