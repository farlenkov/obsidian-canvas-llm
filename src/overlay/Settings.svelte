<script>

    import { SquareArrowOutUpRight, Loader } from 'lucide-svelte';
    import settings from './Settings.svelte.js';
    import CloseOverlay from './CloseOverlay.svelte';
    import providersInfo from '$lib/models/ProviderInfo.svelte.js';
    
</script>

<div class='modal mod-sidebar-layout'>

    <div class="modal-close-button" onclick={() => settings.Hide()}></div>

    <div class="modal-content">

        <div class="vertical-tab-content-container">
            <div class="vertical-tab-content">
                <div class="vertical-tab-header-group">
                    <div class="vertical-tab-header-group-title">
                        API Keys
                    </div>
                    <div class="vertical-tab-header-group-items">

                        {#each providersInfo.list as provider}

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
                                        bind:value={settings.Data[provider.id + "Key"]} 
                                        placeholder="API key for {provider.name}"
                                        onchange={() => settings.Save()} />
                                </div>
                            </div>
                        
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    
    .modal
    {
        width:      var(--modal-width);
        height:     var(--modal-height);

        max-width:  30em;
        max-height: 29em;
    }

    .setting-item-name 
    { 
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

</style>