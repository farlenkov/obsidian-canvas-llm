<script>
    
    import Generate from '../nodes/Generate/GenerateParams.svelte';
    import generate from '../nodes/Generate/GenerateParams.svelte.js';

    import Settings from './Settings.svelte';
    import settings from './Settings.svelte.js';

</script>

{#if settings.IsVisible || generate.IsVisible}

    <div class="modal-container">
        <div class="modal-bg" style="opacity: 0.85;"></div>
        
            {#if settings.IsVisible}
                <Settings />
            {:else if generate.IsVisible}
                <Generate />
            {/if}
            
    </div>

{/if}

<style>

.full-screen
{
    background: rgba(0, 0, 0, 0.95);
}

</style>