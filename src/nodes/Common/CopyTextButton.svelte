<script>

	import { getContext } from 'svelte';
    import { Copy } from 'lucide-svelte';

    const { nodeState, copyThink } = $props();
    const appState = getContext("appState");

    async function onClick(ev)
    {
        if (!navigator.clipboard)
            return;

        const branch = await appState.graph.getMessages(nodeState.id, appState.app);

        if (!ev.shiftKey)
        {
            const message = branch[branch.length-1];
            navigator.clipboard.writeText(message.content);
        }
        else
        {
            let result = "";

            for (let message of branch)
            {
                const messageText = message.content;

                if (!result)
                    result = messageText;
                else
                    result += "\n\n---\n\n" + messageText;
            }

            navigator.clipboard.writeText(result);
        }
    }
    
</script>

<button 
    class="copy-text clickable-icon"
    aria-label="Copy text" 
    onclick={onClick}>
    <Copy size={16}/>  
</button>