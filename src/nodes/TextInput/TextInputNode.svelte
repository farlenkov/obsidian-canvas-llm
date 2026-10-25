<script>

    import { getContext, onMount } from 'svelte';
    import { SquarePen, Eye } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';

    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import TemplatingButton from '../Common/TemplatingButton.svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import HeadingsButton from '../Common/HeadingsButton.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';
    import EditTitle from '../Common/EditTitle.js';
    
    const { id } = $props();
    const viewState = getContext("viewState");
    const nodeState = viewState.graph.getNodeState(id);

    let readBody;
    let scrollLevel = $state(0);
    let isEdit = $state();

    const getContextItems = () =>
    {
        const contextItems = 
        [
            new EditTitle(
                viewState, 
                nodeState)
        ];

        return contextItems;
    };
    
    onMount(() => 
    {
        const updateNodeInternals = useUpdateNodeInternals();
        nodeState.updateNodeInternals.add(updateNodeInternals);
        viewState.graph.nodeContent.add(id, getMessage);
        viewState.contextItems.add(id, getContextItems);
        
        nodeState.parsePlaceholders(nodeState.value);

        return () => 
        {
            nodeState.updateNodeInternals.del(updateNodeInternals);
            viewState.graph.nodeContent.del(id, getMessage);
            viewState.contextItems.del(id, getContextItems);
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

    function onClickToggleReadMode()
    {
        isEdit = false;
        nodeState.isRead = !nodeState.isRead;
        viewState.updateNode(id, {read : nodeState.isRead}, "ReadMode");
    }

    function onClickHeader(el)
    {
        readBody.scrollTo
        ({
            behavior: 'smooth',
            top: el.offsetTop
        });
    }

    function onClickReadBody()
    {
        isEdit = true;
    }

    function onBlurTextarea()
    {
        isEdit = false;
    }

    function syncScroll(node) 
    {
        const max = () => node.scrollHeight - node.clientHeight;
        const apply = () => (node.scrollTop = scrollLevel * max());

        apply();

        const onscroll = () => 
        {
            const m = max();
            scrollLevel = m > 0 ? node.scrollTop / m : 0;
        };
        
        node.addEventListener('scroll', onscroll, { passive: true });

        if (node instanceof HTMLTextAreaElement)
        {
            node.setSelectionRange(0, 0);
            node.focus({ preventScroll: true });
            apply();
            requestAnimationFrame(apply);
        }

        return { destroy() { node.removeEventListener('scroll', onscroll); } };
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
                    {nodeState.showIcon ? "📝" : ""} 
                    {nodeState.title || (nodeState.isRead ? "Note" : "Input")}
                </node-header-left>
                <node-header-right>

                    {#if nodeState.isRead && !isEdit}
                        <HeadingsButton 
                            bodyEl={readBody}
                            app={viewState.app}
                            class="clickable-icon"
                            onclick={onClickHeader} />
                    {/if}

                    <button 
                        type="button"
                        class="show-markdown clickable-icon"
                        aria-label={nodeState.isRead ? "Switch to edit mode" : "Switch to read mode"}
                        onclick={onClickToggleReadMode}>

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

            {#if nodeState.isRead && !isEdit}
                <node-body 
                    bind:this={readBody} 
                    onclick={onClickReadBody}
                    use:syncScroll
                    class="nodrag nozoom nomenu node-text markdown-rendered">

                    <MarkdownRenderer markdown={nodeState.value} />

                </node-body>
            {:else}
                <node-body class="nomenu">

                    <textarea 
                        bind:value={nodeState.value} 
                        onchange={onChange}
                        onblur={onBlurTextarea}
                        use:syncScroll
                        class="nodrag nozoom node-text"></textarea>

                </node-body>
            {/if}

        </node-content>
    </div>
</div>