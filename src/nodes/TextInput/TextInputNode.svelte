<script>

    import { getContext } from 'svelte';

    import { SquarePen, Eye } from 'lucide-svelte';
    import { Handle, Position, NodeResizer } from '@xyflow/svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';

    const appState = getContext("appState");

    let {id, data, selected} = $props();
    let value = $state(data.value);
    let readMode = $state(data.read ?? false);

    function onChange ()
    {
        appState.graph.updateNode(id, {value: value}, "TextInput");
    }

    function clickToggleReadMode()
    {
        readMode = !readMode;
        data.read = readMode;
        appState.graph.onChange("ReadMode");
    }

</script>

<NodeResizer 
    minWidth={100} 
    minHeight={30} 
    onResizeEnd={() => appState.graph.onChange("NodeResize")} />

<Handle type="target" position={Position.Left} class={readMode ? "" : "edit-mode"} />
<Handle type="source" position={Position.Right} class={readMode ? "" : "edit-mode"} />

<div 
    class="canvas-node" 
    class:edit-mode={!readMode}>

    <div class="canvas-node-container">
        <node-content>
            <node-header>
                <node-header-left>
                    {readMode ? "Note" : "Input"}
                </node-header-left>
                <node-header-right>

                    <button 
                        type="button"
                        class="show-markdown clickable-icon"
                        // class:color-text-accent={!readMode}
                        aria-label={readMode ? "Switch to edit mode" : "Switch to read mode"}
                        onclick={clickToggleReadMode}>

                        {#if readMode}
                            <SquarePen size={16} />
                        {:else}
                            <Eye size={18} />
                        {/if}
                    </button>

                    <CopyTextButton nodeId={id} />
                </node-header-right>

            </node-header>

            {#if readMode}
                <node-body class="nodrag nozoom nomenu node-text markdown-rendered">
                    <MarkdownRenderer markdown={value} />
                </node-body>
            {:else}
                <node-body class="nomenu">

                    <textarea 
                        bind:value 
                        onchange={onChange}
                        class:hide={readMode}
                        class="nodrag nozoom node-text"></textarea>

                </node-body>
            {/if}

        </node-content>
    </div>
</div>

<style>

    textarea
    {
        text-align: left;
    }

</style>