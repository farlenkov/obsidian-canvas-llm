<script>

    import { Copy } from 'lucide-svelte';
    let { text } = $props();

    function onClick()
    {
        if (!text)
            return;

        if (navigator.clipboard)
            navigator.clipboard.writeText(text);
        else
            console.log("[clipboard]", text);
    }
    
</script>

<button 
    class="clickable-icon"
    aria-label="Copy text" 
    onclick={onClick}>
    <Copy size={16}/>  
</button>

<style>

    .btn-dark 
    {
        border-radius: 0.5em;
        padding: 0.25em;
    }

</style>