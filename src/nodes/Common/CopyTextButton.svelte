<script>

	import { getContext } from 'svelte';
    import { Copy } from 'lucide-svelte';
    const { nodeId } = $props();
    const appState = getContext("appState");

    function onClick(ev)
    {
        if (!navigator.clipboard)
            return;

        const branch = appState.graph.getBranch(nodeId);
        
        if (!ev.shiftKey)
        {
            const node = branch[branch.length-1];
            const text = getText(node);
            navigator.clipboard.writeText(text);
        }
        else
        {
            let text = "";

            for (var i = 0; i < branch.length; i++)
            {
                const node = branch[i];

                if (!text)
                    text = getText(node);
                else
                    text += "\n\n---\n\n" + getText(node);
            }

            navigator.clipboard.writeText(text);
        }
    }

    function getText(node)
    {
        switch (node.type)
        {
            case "textInput": return node.data.value; break;
            case "generate": return node.data.markdowns[node.data.part]; break;
        }
    }
    
</script>

<button 
    class="clickable-icon"
    aria-label="Copy text" 
    onclick={onClick}>
    <Copy size={16}/>  
</button>