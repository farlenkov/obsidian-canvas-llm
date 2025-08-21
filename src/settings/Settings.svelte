<script>

    import { SquareArrowOutUpRight } from 'lucide-svelte';

    const { appState, modal } = $props();

</script>

<div class="vertical-tab-content-container">
    <div class="vertical-tab-content">
        <div class="vertical-tab-header-group">
            <div class="vertical-tab-header-group-title">
                API Keys
            </div>
            <div class="vertical-tab-header-group-items">

                {#each appState.providers.List as provider}

                    <div class="setting-item">
                        <div class="setting-item-info">
                            <div class="setting-item-name">
                                {provider.name} 
                                <a 
                                    href="{provider.keys}" 
                                    target="_blank" 
                                    aria-label="Get API key from {provider.name}">
                                    <SquareArrowOutUpRight size={16} />
                                </a>
                            </div>
                            <div class="setting-item-description"></div>
                        </div>
                        <div class="setting-item-control">
                            <input 
                                type="text"
                                class="inputbox1" 
                                bind:value={appState.settings.Data[provider.id + "Key"]} 
                                placeholder="API key for {provider.name}"
                                onchange={() => appState.settings.Save()} />
                        </div>
                    </div>
                
                {/each}
            </div>
        </div>
    </div>
</div>

<style>

    .vertical-tab-content
    {
        padding-top: var(--size-4-4);
        padding-bottom: var(--size-4-4);
    }

    .setting-item-name 
    { 
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

</style>