<script>

    import { getContext, onMount } from 'svelte';
    import { Play, XIcon, ArrowUpToLine, ArrowDownToLine, FileXCorner, Hourglass } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    import { delay, sleep } from '$lib/svelte-obsidian/src/Async.js';

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
    const stepsVariants = [100, 40, 20, 10, 4, 2, 1];
    
    let hideStepsMenu = $state(false);
    
    nodeState.onStartEdit.on(scrollToBottom);

    const contextItems =
    [{
        label : "CLEAR MESSAGES",
        class : "is-warning",
        icon : FileXCorner,
        callback : () => 
        {
            nodeState.clearMessages();
            saveMessages();
        }
    }];

    onMount(() => 
    {
        scrollToBottom();

        const updateNodeInternals = useUpdateNodeInternals();
        nodeState.updateNodeInternals.add(updateNodeInternals);
        viewState.graph.getNodeContent[id] = getMessage;
        viewState.contextItems[id] = contextItems;

        return () => 
        {
            nodeState.updateNodeInternals.del(updateNodeInternals);
            delete viewState.graph.getNodeContent[id];
            delete viewState.contextItems[id];
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
        nodeState.progressStep = 1;
        nodeState.progressSteps = nodeState.allowSteps ? nodeState.steps : 1;

        try
        {
            while(nodeState.progressStep <= nodeState.progressSteps)
            {
                await nodeState.generate();
                saveMessages();

                nodeState.progressStep++;

                if (nodeState.cancelSequence)
                {
                    nodeState.cancelSequence = false;
                    break;
                }
            }
        }
        catch (err)
        {
            console.log(err);
        }

        nodeState.progressStep = 1;
        nodeState.progressSteps = 1;
        nodeState.cancelSequence = false;
    }

    function clickCancel()
    {
        nodeState.cancelSequence = true;
        nodeState.progressSteps = nodeState.progressStep;
    }

    function saveMessages()
    {
        viewState.updateNode(
            nodeState.id,
            { messages : nodeState.messages },
            "newDialogueMessage");
    }

    async function clickStepsCount(count)
    {
        viewState.updateNode(
            nodeState.id,
            { steps : count },
            "changeStepsCount");

        nodeState.steps = count;
        hideStepsMenu = true;
        await sleep(10);
        hideStepsMenu = false;
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
                    <div>
                        {#if nodeState.inProgress}
                            ⏳{nodeState.progressStep}/{nodeState.progressSteps}&nbsp;&nbsp;
                        {/if}
                        🗪 {nodeState.title || "Dialogue"}
                    </div>
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

                        <div class="dialogue-message-next" class:empty={nodeState.currentThread.length == 0}>

                            <RunButton
                                inProgress={nodeState.inProgress}
                                label1={nodeState.steps == 1 ? "Generate next message" : `Generate ${nodeState.steps} messages`} 
                                label2={`Generating message ${nodeState.progressStep} of ${nodeState.progressSteps}`} 
                                label3={nodeState.hasMessages ? "CONTINUE" : "START"}
                                label4={`Generating (${nodeState.progressStep}/${nodeState.progressSteps})`}
                                class="mod-cta",
                                onclick={clickGenerate}
                                Icon={Play} />

                            {#if nodeState.allowSteps}
                                
                                {#if !nodeState.inProgress}
                                    <div class="steps-selector">
                                        {#if !hideStepsMenu}
                                            <div class="menu">
                                                {#each stepsVariants as steps}
                                                    <div 
                                                        class="menu-item tappable" 
                                                        onclick={() => clickStepsCount(steps)}>
                                                        <div class="menu-item-title">×{steps}</div>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                        <button aria-label="The number of messages to generate at one go">
                                            ×{nodeState.steps}
                                        </button>
                                    </div>

                                {:else}

                                    {#if nodeState.cancelSequence || nodeState.progressStep < nodeState.progressSteps}
                                        <button 
                                            class="mod-destructive" 
                                            aria-label={nodeState.cancelSequence ? "Waiting for the current generation to complete" : "Cancel the remaining generations"}
                                            disabled={nodeState.cancelSequence}
                                            onclick={clickCancel}>
                                            
                                            {#if !nodeState.cancelSequence}
                                                <XIcon size={16} />
                                            {:else}
                                                <Hourglass size={16} />
                                            {/if}                                            
                                        </button>
                                    {/if}
                                {/if}
                            {/if}

                        </div>

                    {:else}
                        <Message {nodeState} {viewState} {saveMessages} messageNum={nodeState.currentThread.length+1} />
                    {/if}
                {/if}

            </node-body>
        </node-content>
    </div>
</div>