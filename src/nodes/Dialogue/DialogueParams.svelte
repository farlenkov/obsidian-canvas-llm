<script>

    import { Settings } from 'lucide-svelte';
    import Modal from '$lib/svelte-obsidian/src/Modal.js';
    import ModelSelect from '$lib/svelte-llm/settings/ModelSelect.svelte';
    import ModelSelectState from '$lib/svelte-llm/settings/ModelSelect.svelte.js';

    const { nodeState, modal } = $props();
    
    // const modelSelectState = new ModelSelectState();
    // let modelSelectModal;

    function save()
    {
        nodeState.updateNodeTooltip();

        nodeState.appState.graph.updateNode(
            nodeState.id,
            { roles : nodeState.roles },
            "RoleChange");
    }

    function changeName(ev, role)
    {
        save();
    }
    
    function clickModel(role)
    {
        const modelSelectState = new ModelSelectState();

        modelSelectState.ModelID = 
            role.model ||
            nodeState.appState.settings.Data.defaultModel;
        
        modelSelectState.ProviderID = 
            role.provider ||
            nodeState.appState.settings.Data.defaultProvider;

        const modal = new Modal(
            ModelSelect, 
            {
                app : nodeState.app, 
                modelSelectState,
                
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
                "svelte-llm-model-select-container"
            ]);

        modal.open();
    }

</script>

<div class="role-list">
    {#each nodeState.roles as role, index}
        <div class="role-item">

            <div class="role-label-and-model">
                <div  class="role-label">
                    {nodeState.ROLE_LABELS[index]}
                </div>

                <div class="role-model">

                    <div class="role-model-label">
                        {role.provider} / {role.model}
                    </div>

                    <button 
                        type="button" 
                        class="clickable-icon" 
                        aria-label="Select model" 
                        onclick={() => clickModel(role)}>
                        <Settings size={16}/> 
                    </button>

                </div>
            </div>
            
            <input 
                type="text"
                class="role-name"
                placeholder={"Title for " + nodeState.ROLE_LABELS[index]}
                bind:value={role.name}
                onchange={(ev) => changeName(ev, role)} />            
        </div>
    {/each}
</div>