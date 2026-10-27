<script>

    import { Settings } from 'lucide-svelte';
    import NodeState from './DialogueNode.svelte.js';
    import ParamsRole from './ParamsRole.js';

    const { nodeState, viewState, role, role2, index } = $props();
    const roleParams = new ParamsRole(nodeState, viewState, role);

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
        onchange={() => roleParams.save()} />

    <div class="role-model">

        <label
            class="role-model-label"
            aria-label="Use LLM to play this role">
            
            <input
                type="checkbox"
                bind:checked={role.bot}
                onchange={() => roleParams.save()}>

            {role.provider} / {role.model}

        </label>

        <button 
            type="button"
            disabled={!role.bot}
            class="clickable-icon" 
            class:disabled={!role.bot}
            aria-label="Select model" 
            onclick={() => roleParams.openModelSelect()}>
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
            onchange={() => roleParams.save()}>

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
            onchange={() => roleParams.save()}>

        Reply automatically

    </label>
</div>