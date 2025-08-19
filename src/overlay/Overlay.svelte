<script>
    
    import { getContext } from 'svelte';
    import GenerateNode from '../nodes/Generate/GenerateNodeParams.svelte';
    import Settings from './Settings.svelte';

    const appState = getContext("appState");

</script>

{#if appState.SettingsIsVisible || appState.generateNodeParams.IsVisible}

    <div class="modal-container">
        <div class="modal-bg" style="opacity: 0.85;"></div>
        
            {#if appState.SettingsIsVisible}
                <Settings />
            {:else if appState.generateNodeParams.IsVisible}
                <GenerateNode />
            {/if}
            
    </div>

{/if}

<style>

.full-screen
{
    background: rgba(0, 0, 0, 0.95);
}

</style>