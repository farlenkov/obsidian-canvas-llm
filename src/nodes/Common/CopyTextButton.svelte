<script>

	import { getContext } from 'svelte';
    import { Copy } from 'lucide-svelte';

    const { nodeState, copyThink, label, onclick } = $props();
    const appState = getContext("appState");

    async function onClick(ev)
    {
        if (!navigator.clipboard)
            return;

        if (onclick)
            return onclick(ev);

        const copyText = await nodeState.getCopy(ev.shiftKey);
        navigator.clipboard.writeText(copyText);
    }
    
</script>

<button 
    class="copy-text clickable-icon"
    aria-label={label || "Copy text"}
    onclick={onClick}>
    <Copy size={16}/>  
</button>