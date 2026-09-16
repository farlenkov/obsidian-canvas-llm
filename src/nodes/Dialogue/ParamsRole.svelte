<script>

    import { Settings, X } from 'lucide-svelte';
    import NodeState from './DialogueNode.svelte.js';
    import Modal from '$lib/svelte-obsidian/src/Modal.js';
    import ModelSelect from '$lib/svelte-llm/settings/ModelSelect.svelte';

    const { nodeState, viewState, role, role2, index } = $props();

    function save()
    {
        viewState.updateNode(
            nodeState.id,
            { roles : nodeState.roles },
            "changeDialogueRole");

        nodeState.updateNodeTooltip();
        nodeState.updateAllowSteps();
        nodeState.updateHandles();
    }
    
    function clickModel(role)
    {
        const modal = new Modal(
            ModelSelect, 
            {
                app : viewState.app,
                modelId : role.model,
                providerId : role.provider,
                onShowSettings : () => viewState.showSettings(),
                
                onModelSelected : model => 
                {
                    role.model = model.id;
                    role.provider = model.providerId;

                    save();
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

</script>

<div class="role-item role-item{index + 1}">

    <div class="role-label">
        {NodeState.ROLE_LABELS[index]}
    </div>

    <input
        type="text"
        class="role-name"
        placeholder={"Title for " + NodeState.ROLE_LABELS[index]}
        bind:value={role.name}
        onchange={save} />

    <div class="role-model">

        <label
            class="role-model-label"
            aria-label="Use LLM to play this role">
            
            <input
                type="checkbox"
                bind:checked={role.bot}
                onchange={save}>

            {role.provider} / {role.model}

        </label>

        <button 
            type="button"
            disabled={!role.bot}
            class="clickable-icon" 
            class:disabled={!role.bot}
            aria-label="Select model" 
            onclick={() => clickModel(role)}>
            <Settings size={16}/>
        </button>

    </div>
    
    <label
        class="role-memory"
        class:disabled={!role.bot}
        aria-label="Model can use this memory to store secrets hidden from interlocutor">
        
        <input
            type="checkbox"
            bind:checked={role.memory}
            disabled={!role.bot}
            onchange={save}>

        Use hidden memory

    </label>

    <label
        class="role-auto"
        class:disabled={!role.bot || role2.bot}
        aria-label="LLM will be called automatically when you submit your message">
        
        <input
            type="checkbox"
            bind:checked={role.auto}
            disabled={!role.bot || role2.bot}
            onchange={save}>

        Reply automatically

    </label>
</div>