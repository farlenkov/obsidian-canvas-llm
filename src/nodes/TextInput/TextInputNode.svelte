<script>

    import { getContext, onMount } from 'svelte';
    import { SquarePen, Eye } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';

    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import TemplatingButton from '../Common/TemplatingButton.svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';

    const { id } = $props();
    const viewState = getContext("viewState");
    const nodeState = viewState.graph.getNodeState(id);  
    
    onMount(() => 
    {
        const updateNodeInternals = useUpdateNodeInternals();
        nodeState.updateNodeInternals.add(updateNodeInternals);
        viewState.graph.getNodeContent[id] = getMessage;
        
        nodeState.parsePlaceholders(nodeState.value);

        return () => 
        {
            nodeState.updateNodeInternals.del(updateNodeInternals);
            delete viewState.graph.getNodeContent[id];
        };
    });

    async function getMessage()
    {
        return { role : "user", content : nodeState.value };
    }

    function onChange ()
    {
        viewState.updateNode(id, {value : nodeState.value}, "TextInput");
        nodeState.parsePlaceholders(nodeState.value);
    }

    function clickToggleReadMode()
    {
        nodeState.isRead = !nodeState.isRead;
        viewState.updateNode(id, {read : nodeState.isRead}, "ReadMode");
    }

</script>

<NodeResizer 
    minWidth={100} 
    minHeight={30} 
    inputs={nodeState.allIns} />

<Handles 
    inputs={nodeState.isTemplate ? nodeState.allIns : []}
    class={nodeState.isRead ? "" : "edit-mode"} />

<div 
    class="canvas-node" 
    class:edit-mode={!nodeState.isRead}>

    <div class="canvas-node-container">
        <node-content>
            <node-header>
                <node-header-left>
                    {nodeState.isRead ? "Note" : "Input"}
                </node-header-left>
                <node-header-right>

                    <button 
                        type="button"
                        class="show-markdown clickable-icon"
                        aria-label={nodeState.isRead ? "Switch to edit mode" : "Switch to read mode"}
                        onclick={clickToggleReadMode}>

                        {#if nodeState.isRead}
                            <SquarePen size={16} />
                        {:else}
                            <Eye size={18} />
                        {/if}
                    </button>

                    <TemplatingButton {nodeState} {viewState} />
                    <CopyTextButton {nodeState} />
                </node-header-right>

            </node-header>

            {#if nodeState.isRead}
                <node-body class="nodrag nozoom nomenu node-text markdown-rendered">
                    <MarkdownRenderer markdown={nodeState.value} />
                </node-body>
            {:else}
                <node-body class="nomenu">

                    <textarea 
                        bind:value={nodeState.value} 
                        onchange={onChange}
                        class:hide={nodeState.isRead}
                        class="nodrag nozoom node-text"></textarea>

                </node-body>
            {/if}

        </node-content>
    </div>
</div>