<script>

	import { getContext } from 'svelte';
    import { Copy } from 'lucide-svelte';
    import nodeTypes from '$lib/nodes/Type/NodeTypes.js';

    const { nodeId, copyThink } = $props();
    const appState = getContext("appState");

    async function onClick(ev)
    {
        if (!navigator.clipboard)
            return;

        const branch = appState.graph.getBranch(nodeId);
        
        if (!ev.shiftKey)
        {
            const node = branch[branch.length-1];
            const nodeType = nodeTypes.ById[node.type];
            const nodeText = await nodeType.getText(appState.app, node, copyThink);
            navigator.clipboard.writeText(nodeText);
        }
        else
        {
            let text = "";

            for (var i = 0; i < branch.length; i++)
            {
                const node = branch[i];
                const nodeType = nodeTypes.ById[node.type];
                const nodeText = await nodeType.getText(appState.app, node);

                if (!text)
                    text = nodeText;
                else
                    text += "\n\n---\n\n" + nodeText;
            }

            navigator.clipboard.writeText(text);
        }
    }
    
</script>

<button 
    class="copy-text clickable-icon"
    aria-label="Copy text" 
    onclick={onClick}>
    <Copy size={16}/>  
</button>