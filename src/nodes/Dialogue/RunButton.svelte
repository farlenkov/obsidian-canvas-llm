<script>
    import { Loader } from 'lucide-svelte';
    const { inProgress, label1, label2, label3, label4, class: className, onclick, Icon } = $props();
</script>

{#if !inProgress}

    <button 
        onclick={onclick}
        class={className}
        aria-label={label1}>

        <Icon size={16}/>
        {label3}

    </button>

{:else}

    <button 
        disabled
        class={className}
        aria-label={label2}>

        <Loader size={16} class="rotate"/> 
        {label4}

    </button>

{/if}

<style>

    button
    {
        display: flex;
        flex-direction: row;
        gap: 0.5em;
        align-items: center;
        justify-content: center;
    }

</style>