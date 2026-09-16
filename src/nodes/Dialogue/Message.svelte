<script>

    import { onMount } from 'svelte';
    import { RefreshCcw, ChevronLeft, ChevronRight, Lightbulb, ArrowUp, SquarePen, X, ArrowUpToLine, ArrowDownToLine } from 'lucide-svelte';
    import { delay } from '$lib/svelte-obsidian/src/Async.js';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import GenericButton from '../Common/GenericButton.svelte';
    import RunButton from './RunButton.svelte';

    const {nodeState, viewState, message, messageNum, saveMessages} = $props();
    
    let textarea;
    let rootEl = $state();
    let headEl = $state();
    // disabled={rootEl?.previousElementSibling}
    // disabled={rootEl?.nextElementSibling}

    onMount(() => 
    {
        textareaResize(100, true);
    });

    function startEdit(message)
    {
        nodeState.startEdit(message);
        textareaResize(1);
        saveEdit();
    }

    function resetEdit()
    {
        nodeState.resetEdit();
        textareaResize(100);
        saveEdit();
    }

    function submitEdit()
    {
        nodeState.submitEdit();
        textareaResize(100);
        saveMessages();
        saveEdit();
    }

    function submitInput()
    {
        nodeState.submitInput();
        textareaResize(100);
        saveMessages();
        saveInput();
    }

    async function generate(message)
    {
        await nodeState.generate(message);
        saveMessages();
    }

    function saveEdit()
    {        
        viewState.updateNode(
            nodeState.id,
            { 
                editId : nodeState.editId,
                edit   : nodeState.editText,
            },
            "editDialogueMessage");
    }

    function saveInput()
    {        
        viewState.updateNode(
            nodeState.id,
            { input : nodeState.inputText },
            "editDialogueMessage");
    }

    async function clickCopy(ev)
    {
        const copyText = await nodeState.getCopy(ev.shiftKey, message);
        navigator.clipboard.writeText(copyText);
    }

    function switchVariation(message, change)
    {
        nodeState.switchVariation(message, change);
        saveMessages();
    }

    let resizeCounter = 1;

    function textareaResize(timeout, skipScroll) 
    {
        delay (timeout, () =>
        {
            if (!textarea)
                return;

            if (nodeState.savedScrollTop)
                skipScroll = true;

            if (!skipScroll)
            {
                nodeState.savedScrollTop = nodeState.nodeBody?.scrollTop;

                nodeState.wasAtBottom = nodeState.nodeBody 
                    ? nodeState.nodeBody.scrollHeight - nodeState.nodeBody.clientHeight - nodeState.nodeBody.scrollTop < 30
                    : false;
            }
            
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";

            if (skipScroll)
                return;

            const counter = resizeCounter++;

            requestAnimationFrame(() => 
            {
                if (!nodeState.nodeBody)
                    return;
                
                nodeState.nodeBody.scrollTop = nodeState.savedScrollTop + (nodeState.wasAtBottom ? 100 : 0);
                // console.log(counter, "<", nodeState.wasAtBottom, nodeState.savedScrollTop);

                delete nodeState.savedScrollTop;
                delete nodeState.wasAtBottom;
            });
        });
    }

    function scrollUp()
    {
        scroll(rootEl);
    }

    function scrollDown()
    {
        scroll(rootEl.nextElementSibling);
    }

    function scroll(child) 
    {
        const parent = nodeState.nodeBody;

        parent.scrollTo
        ({
            behavior: 'smooth',
            top: child.offsetTop - headEl.scrollHeight - 8
        });
    }

</script>

{#if message}

    <div 
        class="dialogue-message"
        class:edit={message.id === nodeState.editId}
        bind:this={rootEl}>
        <div class="dialogue-message-head" bind:this={headEl}>
            <div 
                class="dialogue-message-role"
                aria-label={message.model}>
                    <span class="dialogue-message-num">#{messageNum+1}</span> 
                    <span class="dialogue-message-role-name">{@html nodeState.getRoleName(message.role)}</span>
            </div>
            <div class="dialogue-message-buttons">

                <GenericButton 
                    onclick={scrollUp} 
                    icon={ArrowUpToLine} 
                    label="Scroll up" />
                
                <GenericButton 
                    onclick={scrollDown} 
                    icon={ArrowDownToLine} 
                    label="Scroll down" />

                {#if message.id !== nodeState.editId}

                    {#if nodeState.hasVariations(nodeState.parentIds[message.id])}
                        <div class="dialogue-message-variants">

                            <button 
                                class="clickable-icon"
                                aria-label="Prev variation"
                                disabled={nodeState.inProgress}
                                onclick={() => switchVariation(message, -1)}>
                                <ChevronLeft size={16}/>
                            </button>

                            {nodeState.variantNum[message.id]}
                            / 
                            {nodeState.messages[nodeState.parentIds[message.id]].length}

                            <button 
                                class="clickable-icon"
                                aria-label="Next variation"
                                disabled={nodeState.inProgress}
                                onclick={() => switchVariation(message, 1)}>
                                <ChevronRight size={16}/>
                            </button>

                        </div>
                    {/if}

                    {#if message.think}
                        {#if !nodeState.thinkSwitch[message.id]}
                            <button 
                                class="clickable-icon"
                                aria-label="Show reasoning"
                                onclick={() => nodeState.thinkSwitch[message.id] = true}>
                                <Lightbulb size={16}/>
                            </button>
                        {:else}
                            <button 
                                class="clickable-icon color-text-accent"
                                aria-label="Show message"
                                onclick={() => delete nodeState.thinkSwitch[message.id]}>
                                <Lightbulb size={16}/>
                            </button>
                        {/if}
                    {/if}

                    <button 
                        class="clickable-icon"
                        aria-label="Edit message"
                        disabled={nodeState.inProgress}
                        onclick={() => startEdit(message)}>
                        <SquarePen size={16}/>
                    </button>

                    <CopyTextButton 
                        label="Copy message" 
                        onclick={clickCopy} />

                {:else}

                    <button 
                        class="clickable-icon" 
                        aria-label="Cancel edit"
                        onclick={resetEdit}>
                        <X size={16} />
                    </button>

                    <button 
                        class="mod-cta" 
                        aria-label="Save message"
                        onclick={submitEdit}>
                        <ArrowUp size={16} />
                    </button>

                {/if}
                
                {#if nodeState.roles[message.role].bot}

                    <RunButton
                        inProgress={nodeState.inProgress}
                        label1="Regenarate" 
                        label2="Generating..." 
                        class="clickable-icon",
                        onclick={() => generate(message)}
                        Icon={RefreshCcw} />

                {/if}

            </div>
        </div>
        <div class="dialogue-message-body">

            {#if message.id !== nodeState.editId}

                {#if !nodeState.thinkSwitch[message.id]}

                    {#if message.system}
                        <MarkdownRenderer markdown={message.system} label="System" className="system" />
                    {/if}

                    {#if message.private}
                        <MarkdownRenderer markdown={message.private} label="Memory" className="private" />
                        <MarkdownRenderer markdown={message.public} />
                    {:else}
                        <MarkdownRenderer markdown={message.text} />
                    {/if}

                {:else}
                    <MarkdownRenderer markdown={message.think} />
                {/if}

            {:else}
            
                <textarea 
                    rows="1"
                    placeholder="Type your message here"
                    bind:this={textarea}
                    bind:value={nodeState.editText}
                    onchange={() => saveEdit()}
                    oninput={() => textareaResize()}></textarea>

            {/if}
        </div>
    </div>

{:else}

    <div class="dialogue-message edit">
        <div class="dialogue-message-head">
            <div class="dialogue-message-role">
                <span class="dialogue-message-num">#{messageNum}</span> 
                <span class="dialogue-message-role-name">Your messge</span>
            </div>
            <div class="dialogue-message-buttons">

                <RunButton
                    inProgress={nodeState.inProgress}
                    label1="Send your message" 
                    label2="Generating..." 
                    class="mod-cta",
                    onclick={submitInput}
                    Icon={ArrowUp} />

            </div>
        </div>
        <div class="dialogue-message-body">
            <textarea 
                rows="1"
                placeholder="Type your message here"
                bind:this={textarea}
                bind:value={nodeState.inputText}
                onchange={() => saveInput()}
                oninput={() => textareaResize()}></textarea>
        </div>
    </div>

{/if}