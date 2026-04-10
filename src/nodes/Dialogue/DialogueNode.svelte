<script>

    import { getContext, onMount } from 'svelte';
    import { Play, XIcon, ArrowUpToLine, ArrowDownToLine } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';

    import NodeState from './DialogueNode.svelte.js';
    import ParamsButton from '../Common/ParamsButton.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import GenericButton from '../Common/GenericButton.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';
    import Handles from '../Common/Handles.svelte';
    import RunButton from './RunButton.svelte';
    import Message from './Message.svelte';
    import Modal from '$lib/svelte-obsidian/src/Modal.js';
    import DialogueParamsView from './DialogueParams.svelte';

    const {id, data, selected} = $props();
    const appState = getContext("appState");
    const nodeState = new NodeState(id, data, appState, useUpdateNodeInternals());

    let nodeBody;

    onMount(() => 
    {
        setTimeout(() => { nodeBody.scrollTop = nodeBody?.scrollHeight }, 100);

        appState.graph.getNodeContent[id] = getMessage;
        return () => delete appState.graph.getNodeContent[id];
    });

    async function getMessage()
    {
        let text = nodeState.getCopy();
        return { role : "user", content : text };
    }

    function showParams()
    {
        new Modal(
            DialogueParamsView, 
            {
                app : nodeState.app, 
                nodeState
            }, 
            [
                "svelte-obsidian", 
                "canvas-llm", 
                "canvas-llm-dialogue-params"
            ])
            .open();
    }

    nodeState.onMessageAdd = msg =>
    {
        setTimeout(() => 
        {
            const lastMessageEL = nodeBody.querySelector('.dialogue-message:last-of-type');

            if (lastMessageEL)
                nodeBody.scrollTop = lastMessageEL.offsetTop;

        }, 100);
    }

</script>

<NodeResizer 
    minWidth={320} 
    minHeight={30} />

<Handles inputs = {[
    { "role1" : (nodeState.roles[0].name || nodeState.ROLE_LABELS[0]) + " (system prompt)" }, 
    { "role2" : (nodeState.roles[1].name || nodeState.ROLE_LABELS[1]) + " (system prompt)" }]} />

<div class="canvas-node" class:error={nodeState.error}>
    <div class="canvas-node-container">
        <node-content>

            <node-header>
                <node-header-left aria-label={nodeState.nodeTooltip}>
                    Dialogue
                </node-header-left>
                <node-header-right>
                    
                    <GenericButton 
                        onclick={ev => nodeBody.scrollTop = 0} 
                        icon={ArrowUpToLine} 
                        label="Scroll to top" />
                    
                    <GenericButton 
                        onclick={ev => nodeBody.scrollTop = nodeBody.scrollHeight} 
                        icon={ArrowDownToLine} 
                        label="Scroll to bottom" />

                    <CopyTextButton {nodeState} label="Copy thread" />
                    <ParamsButton onclick={showParams} />
                </node-header-right>
            </node-header>

            <node-body class="nodrag nozoom nomenu node-text markdown-rendered" bind:this={nodeBody}>

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
                    <Message {message} {messageNum} {nodeState}/>
                {/each}
                
                <div class="dialogue-message-next">
                    <RunButton
                        inProgress={nodeState.inProgress}
                        label1="Generate" 
                        label2="Generating..." 
                        label3={nodeState.hasMessages ? "CONTINUE" : "START"}
                        label4="GENERATING..."
                        class="mod-cta",
                        onclick={() => nodeState.generate()}
                        Icon={Play} />
                </div>

            </node-body>

        </node-content>
    </div>
</div>