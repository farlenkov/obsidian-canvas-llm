<script>

    import { getContext, onMount } from 'svelte';
    import { Play, XIcon, ArrowUpToLine, ArrowDownToLine, Hourglass, Loader } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    import { delay, sleep } from '$lib/svelte-obsidian/src/Async.js';

    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import HeadingsButton from '../Common/HeadingsButton.svelte';
    import GenericButton from '../Common/GenericButton.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';
    import RunButton from './RunButton.svelte';
    import Message from './Message.svelte';
    import Modal from '$lib/svelte-obsidian/src/Modal.js';
    import ParamsView from './Params.svelte'
    import EditTitle from '../Common/EditTitle.js';

    const { id } = $props();
    const viewState = getContext("viewState");
    const nodeState = viewState.graph.getNodeState(id);
    const stepsVariants = [100, 40, 20, 10, 4, 2, 1];
    
    let hideStepsMenu = $state(false);
    let nodeBody = $state();

    const getContextItems = () =>
    {
        const contextItems = 
        [
            new EditTitle(
                viewState, 
                nodeState)
        ];

        if (Object.keys(nodeState.messages).length > 0)
        {
            contextItems.push
            ({
                title : "Delete all messages",
                class : "is-danger",
                icon : "message-square-x",
                onclick : () => 
                {
                    nodeState.clearMessages();
                    saveMessages("Delete messages");
                }
            });
        }

        return contextItems;
    };

    onMount(() => 
    {
        scrollToBottom();

        const updateNodeInternals = useUpdateNodeInternals();
        
        nodeState.updateNodeInternals.on(updateNodeInternals);
        nodeState.onStartEdit.on(scrollToBottom);
        
        viewState.graph.nodeContent.add(id, getMessage);
        viewState.contextItems.add(id, getContextItems);

        return () => 
        {
            nodeState.updateNodeInternals.off(updateNodeInternals);
            nodeState.onStartEdit.off(scrollToBottom);

            viewState.graph.nodeContent.del(id, getMessage);
            viewState.contextItems.del(id, getContextItems);
        };
    });

    async function scrollToBottom(timeout = 100)
    {
        await sleep(timeout);

        if (nodeBody)
            nodeBody.scrollTop = nodeBody.scrollHeight;
    }

    function scrollToElement(messageEl, minusOffset = 0, instant = false) 
    {
        if (!messageEl)
            return;

        nodeBody.scrollTo
        ({
            behavior: instant ? 'instant' : 'smooth',
            top: messageEl.offsetTop - (minusOffset ?? 0)
        });
    }

    function clickUp(ev)
    {
        if (ev.shiftKey)
            nodeBody.scrollTop = 0;
        else
            scrollToNearest('up');
    }

    function clickDown(ev)
    {
        if (ev.shiftKey)
            nodeBody.scrollTop = nodeBody.scrollHeight;
        else
            scrollToNearest('down');
    }

    function scrollToNearest(direction) 
    {
        const containerRect = nodeBody.getBoundingClientRect();
        const scaleY = containerRect.height / nodeBody.offsetHeight;

        if (!scaleY) 
            return;

        const epsilon = 4;
        const items = [...nodeBody.querySelectorAll('.dialogue-message')];

        const candidates = items
            .map(item => 
            ({
                item,
                top: item.getBoundingClientRect().top
            }))
            .filter(({ top }) => 
            {
                return direction === 'up'
                    ? top < containerRect.top - epsilon
                    : top > containerRect.top + epsilon;
            })
            .sort((a, b) => a.top - b.top);

        if (!candidates.length) 
            return;
        
        const target = direction === 'up'
            ? candidates[candidates.length - 1]
            : candidates[0];

        const delta = (target.top - containerRect.top) / scaleY;

        nodeBody.scrollBy
        ({
            top: delta - epsilon / 2,
            behavior: 'smooth'
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
                saveMessages("clickGenerate");

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

    function saveMessages(note)
    {
        // console.log(`saveMessages (${note})`);
        refreshHeadings();

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

    nodeState.onMessageAdd = async msg =>
    {
        await sleep(100);
        refreshHeadings();

        if (nodeState.inProgress)
        {
            scrollToBottom();
            return;
        }

        const messageEls = nodeBody.querySelectorAll('.dialogue-message:not(.edit)');

        if (!messageEls.length)
            return;
        
        const lastMsgEl = messageEls[messageEls.length - 1];
        scrollToElement(lastMsgEl, 0, true);
    }

    function refreshHeadings(callback)
    {
        if (callback)
            refreshHeadings.callback = callback;
        else
            refreshHeadings.callback?.();
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
                        {#if nodeState.inProgress}
                            <Loader size={16} class="rotate"/> 
                            {nodeState.progressStep}/{nodeState.progressSteps}&nbsp;&nbsp;
                        {/if}
                        {nodeState.showIcon ? "💬" : ""} 
                        {nodeState.title || "Dialogue"}
                </node-header-left>
                <node-header-right>

                    <HeadingsButton 
                        bodyEl={nodeBody}
                        app={viewState.app}
                        title="Scroll to message:"
                        class="clickable-icon"
                        selector=".dialogue-message"
                        onclick={scrollToElement}
                        refresh={refreshHeadings} />
                    
                    <GenericButton 
                        onclick={clickUp} 
                        icon={ArrowUpToLine} 
                        label={"Scroll up ▲\n[Shift] Scroll to top"} />
                    
                    <GenericButton 
                        onclick={clickDown} 
                        icon={ArrowDownToLine} 
                        label={"Scroll down ▼\n[Shift] Scroll to bottom"} />

                    <CopyTextButton {nodeState} label="Copy thread" />
                    <ParamsButton onclick={showParams} />
                </node-header-right>
            </node-header>

            <node-body 
                class="nodrag nozoom nomenu node-text markdown-rendered" 
                bind:this={nodeBody}>

                {#if nodeState.error}
                    <error>
                        <div>
                            {nodeState.error}
                        </div>
                        <button type="button" class="btn-dark" onclick={() => {nodeState.error = false}}>
                            <XIcon size={24} strokeWidth={2}/>
                        </button>
                    </error>
                {/if}
                
                {#each nodeState.currentThread as message, messageNum (message.id)}
                    <Message 
                        {message} 
                        {messageNum} 
                        {nodeState} 
                        {viewState} 
                        {nodeBody} 
                        {saveMessages}
                        {scrollToElement} />
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
                        <Message 
                            {nodeState} 
                            {viewState} 
                            {nodeBody} 
                            {saveMessages} 
                            {scrollToElement}
                            messageNum={nodeState.currentThread.length + 1} />
                    {/if}
                {/if}

            </node-body>
        </node-content>
    </div>
</div>