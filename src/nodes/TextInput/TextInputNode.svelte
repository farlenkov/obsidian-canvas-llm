<script>

    import { getContext, onMount } from 'svelte';
    import { SquarePen, Eye } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';

    import NodeState from '../Common/NodeState.svelte.js';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import TemplatingButton from '../Common/TemplatingButton.svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';

    const {id, data, selected} = $props();
    const appState = getContext("appState");
    const nodeState = new NodeState(id, data, appState, useUpdateNodeInternals());  

    let value = $state(data.value);
    let isRead = $state(data.read ?? false);
    nodeState.parsePlaceholders(value);

    onMount(() => 
    {
        appState.graph.getNodeContent[id] = getMessage;
        return () => delete appState.graph.getNodeContent[id];
    });

    async function getMessage()
    {
        return { role : "user", content : value };
    }

    function onChange ()
    {
        appState.graph.updateNode(id, {value: value}, "TextInput");
        nodeState.parsePlaceholders(value);
    }

    function clickToggleReadMode()
    {
        isRead = !isRead;
        appState.graph.updateNode(id, {read: isRead}, "ReadMode");
    }

</script>

<NodeResizer 
    minWidth={100} 
    minHeight={30} 
    inputs={nodeState.allIns} />

<Handles 
    inputs={nodeState.isTemplate ? nodeState.allIns : []}
    class={isRead ? "" : "edit-mode"} />

<div 
    class="canvas-node" 
    class:edit-mode={!isRead}>

    <div class="canvas-node-container">
        <node-content>
            <node-header>
                <node-header-left>
                    {isRead ? "Note" : "Input"}
                </node-header-left>
                <node-header-right>

                    <button 
                        type="button"
                        class="show-markdown clickable-icon"
                        aria-label={isRead ? "Switch to edit mode" : "Switch to read mode"}
                        onclick={clickToggleReadMode}>

                        {#if isRead}
                            <SquarePen size={16} />
                        {:else}
                            <Eye size={18} />
                        {/if}
                    </button>

                    <TemplatingButton {nodeState} />
                    <CopyTextButton {nodeState} />
                </node-header-right>

            </node-header>

            {#if isRead}
                <node-body class="nodrag nozoom nomenu node-text markdown-rendered">
                    <MarkdownRenderer markdown={value} />
                </node-body>
            {:else}
                <node-body class="nomenu">

                    <textarea 
                        bind:value 
                        onchange={onChange}
                        class:hide={isRead}
                        class="nodrag nozoom node-text"></textarea>

                </node-body>
            {/if}

        </node-content>
    </div>
</div>