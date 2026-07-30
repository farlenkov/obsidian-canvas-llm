<script>

    import { getContext, onMount } from 'svelte';
    import { Play, XIcon, ArrowUpToLine, ArrowDownToLine } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    import { delay } from '$lib/svelte-obsidian/src/Async.js';

    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import GenericButton from '../Common/GenericButton.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';
    import RunButton from './RunButton.svelte';
    import Message from './Message.svelte';
    import Modal from '$lib/svelte-obsidian/src/Modal.js';
    import ParamsView from './Params.svelte'

    const { id } = $props();
    const viewState = getContext("viewState");
    const nodeState = viewState.graph.getNodeState(id);

    nodeState.onStartEdit.on(scrollToBottom);

    onMount(() => 
    {
        scrollToBottom();

        const updateNodeInternals = useUpdateNodeInternals();
        nodeState.updateNodeInternals.add(updateNodeInternals);
        viewState.graph.getNodeContent[id] = getMessage;

        return () => 
        {
            nodeState.updateNodeInternals.del(updateNodeInternals);
            delete viewState.graph.getNodeContent[id]
        };
    });

    function scrollToBottom(timeout = 100)
    {
        delay(timeout, () => 
        {
            if (!nodeState.nodeBody)
                return;
            
            nodeState.nodeBody.scrollTop = nodeState.nodeBody.scrollHeight;
        });
    }

    async function getMessage()
    {
        let text = nodeState.getCopy();
        return { role : "user", content : text };
    }

    function showParams()
    {
        new Modal(
            ParamsView, 
            {
                app : nodeState.app, 
                nodeState,
                viewState,
            }, 
            [
                "svelte-obsidian", 
                "canvas-llm", 
                "canvas-llm-dialogue-params"
            ])
            .open();
    }

    async function clickGenerate()
    {
        await nodeState.generate();
        saveMessages();        
    }

    function saveMessages()
    {
        viewState.updateNode(
            nodeState.id,
            { messages : nodeState.messages },
            "newDialogueMessage");
    }

    nodeState.onMessageAdd = msg =>
    {
        setTimeout(() => 
        {
            const lastMessageEL = nodeState.nodeBody?.querySelector('.dialogue-message:last-of-type');

            if (lastMessageEL)
            {
                // console.log("[onMessageAdd]", "offsetTop:", lastMessageEL.offsetTop, "scrollHeight:", nodeBody.scrollHeight)
                nodeState.nodeBody.scrollTop = lastMessageEL.offsetTop;
            }

        }, 100);
    }

</script>

<NodeResizer 
    minWidth={320} 
    minHeight={30} />

<Handles inputs = {nodeState.nodeHandles} />

<div class="canvas-node" class:error={nodeState.error}>
    <div class="canvas-node-container">
        <node-content>

            <node-header>
                <node-header-left aria-label={nodeState.nodeTooltip}>
                    🗪 Dialogue
                </node-header-left>
                <node-header-right>
                    
                    <GenericButton 
                        onclick={ev => nodeState.nodeBody.scrollTop = 0} 
                        icon={ArrowUpToLine} 
                        label="Scroll to top" />
                    
                    <GenericButton 
                        onclick={ev => nodeState.nodeBody.scrollTop = nodeState.nodeBody.scrollHeight} 
                        icon={ArrowDownToLine} 
                        label="Scroll to bottom" />

                    <CopyTextButton {nodeState} label="Copy thread" />
                    <ParamsButton onclick={showParams} />
                </node-header-right>
            </node-header>

            <node-body class="nodrag nozoom nomenu node-text markdown-rendered" bind:this={nodeState.nodeBody}>

                {#if nodeState.error}
                    <error>
                        <div>
                            {@html nodeState.error}
                        </div>
                        <button type="button" class="btn-dark" onclick={() => {nodeState.error = false}}>
                            <XIcon size={24} strokeWidth={2}/>
                        </button>
                    </error>
                {/if}
                
                {#each nodeState.currentThread as message, messageNum}
                    <Message {message} {messageNum} {nodeState} {viewState} {saveMessages}/>
                {/each}

                {#if !nodeState.editId}                
                    {#if nodeState.roles[nodeState.currentThread.length % 2].bot}

                        <div class="dialogue-message-next">
                            <RunButton
                                inProgress={nodeState.inProgress}
                                label1="Generate" 
                                label2="Generating..." 
                                label3={nodeState.hasMessages ? "CONTINUE" : "START"}
                                label4="GENERATING..."
                                class="mod-cta",
                                onclick={clickGenerate}
                                Icon={Play} />
                        </div>

                    {:else}

                        <Message {nodeState} {viewState} {saveMessages} messageNum={nodeState.currentThread.length+1} />

                    {/if}
                {/if}

            </node-body>

        </node-content>
    </div>
</div>