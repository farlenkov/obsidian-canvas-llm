<script>

    import { onMount } from 'svelte';
    import { RefreshCcw, Lightbulb, ArrowUp, SquarePen, X } from 'lucide-svelte';
    import { delay, sleep } from '$lib/svelte-obsidian/src/Async.js';
    import { showContextMenu } from '$lib/svelte-obsidian/src/Menu.js';
    import { truncateByLength, escapeHtmlAttr } from '$lib/svelte-obsidian/src/String.js';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import RunButton from './RunButton.svelte';
    import VersionsButton from '../Common/VersionsButton.svelte';
    import HeadingsButton from '../Common/HeadingsButton.svelte';

    const {
        nodeState, 
        viewState, 
        nodeBody,
        message, 
        messageNum, 
        saveMessages, 
        scrollToElement,
        class:className} = $props();
    
    let textarea;
    let bodyEl, nodeHeadEl;
    let navText = "";
    let versions = [];
    let versionNum = 0;

    if (message)
    {
        versions = nodeState.messages[nodeState.parentIds[message.id] || nodeState.rootId];
        versionNum = nodeState.versionNums[message.id]-1;
        
        let roleName = nodeState.getRoleName(message.role);
        let navVersions = versions.length > 1 ? ' (' + (versionNum + 1) + '/' + (versions.length) + ')' : "";
        let messageText = (message.public || message.text).replace(/\s*[\r\n]+\s*/g, ' ');
        navText = escapeHtmlAttr(truncateByLength(`${messageNum + 1}: ${roleName}${navVersions} → ${messageText}`, 80));
    }
    
    onMount(async () => 
    {
        textareaResize(100, true);
    });

    function startEdit()
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

    async function submitEdit()
    {
        await nodeState.submitEdit();
        textareaResize(100);
        saveMessages("submitEdit");
        saveEdit();
    }

    async function submitInput()
    {
        await nodeState.submitInput();
        textareaResize(100);
        saveMessages("submitInput");
        saveInput();
    }

    async function clickGenerate()
    {
        await nodeState.generate(message);
        saveMessages("clickGenerate in Message");
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

    function clickVersion(num)
    {
        nodeState.setVersion(message, num);
        saveMessages("switchVersion");
    }

    // let resizeCounter = 1;

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
                nodeState.savedScrollTop = nodeBody?.scrollTop;

                nodeState.wasAtBottom = nodeBody 
                    ? nodeBody.scrollHeight - nodeBody.clientHeight - nodeBody.scrollTop < 30
                    : false;
            }
            
            textarea.style.height = "auto";
            textarea.style.height = Math.max(20, textarea.scrollHeight) + "px";

            if (skipScroll)
                return;

            // const counter = resizeCounter++;

            requestAnimationFrame(() => 
            {
                if (!nodeBody)
                    return;
                
                nodeBody.scrollTop = nodeState.savedScrollTop + (nodeState.wasAtBottom ? 100 : 0);
                // console.log(counter, "<", nodeState.wasAtBottom, nodeState.savedScrollTop);

                delete nodeState.savedScrollTop;
                delete nodeState.wasAtBottom;
            });
        });
    }

    function contextHead(event)
    {
        const menu =
        [{
            app : viewState.app,
            event : event,
            class : 'svelte-obsidian',
        }];

        if (nodeState.roles[message.role].bot)
        {
            menu.push
            ({
                title : `Edit message`,
                icon : "square-pen",
                disabled : nodeState.inProgress,
                onclick : () => startEdit()
            });
        }

        if (message && versions.length > 1)
        {
            menu.push
            ({
                title : `Delete version (${versionNum + 1}/${versions.length})`,
                class : "is-danger",
                icon : "list-x",
                disabled : nodeState.inProgress,
                onclick : () => 
                {  
                    const delete_count = nodeState.deleteVersion(message);
                    nodeState.updateCurrentThread();
                    saveMessages("deleteVersion");
                    deleteNotice(delete_count);
                }
            });
        }

        menu.push
        ({
            icon : "message-square-x",                
            class : "is-warning",
            title : `Delete message`,
            disabled : nodeState.inProgress,

            onclick : () => 
            {
                const parentId = nodeState.parentIds[message.id] || nodeState.rootId;
                const delete_count = nodeState.deleteMessagesByParent(parentId);
                nodeState.updateCurrentThread();
                saveMessages("deleteMessagesByParent");
                deleteNotice(delete_count);
            }
        });

        showContextMenu(menu);
    }

    function deleteNotice(delete_count)
    {
        if (delete_count > 0)
            new Notice(delete_count + ` version(s) deleted`);
    }

    function clickHeader(headerEl)
    {
        scrollToElement(headerEl, nodeHeadEl.scrollHeight + 4);
    }

</script>

{#if message}

    <div 
        class="dialogue-message {className}"
        data-text={navText}
        class:edit={message.id === nodeState.editId}>

        <div 
            class="dialogue-message-head" 
            oncontextmenu={contextHead} 
            bind:this={nodeHeadEl}>

            <div 
                class="dialogue-message-role"
                aria-label={message.model}>
                    <span class="dialogue-message-num">#{messageNum+1}</span> 
                    <span class="dialogue-message-role-name">{@html nodeState.getRoleName(message.role)}</span>
            </div>
            
            <div class="dialogue-message-buttons">

                {#if message.id !== nodeState.editId}

                    <HeadingsButton 
                        {bodyEl}
                        app={viewState.app}
                        class="clickable-icon"
                        onclick={clickHeader} />
                   
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

                    {#if versions.length > 1}

                        <VersionsButton 
                            app={viewState.app}
                            class="clickable-icon"
                            onclick={num => clickVersion(num)}
                            {versions}
                            {versionNum} />

                    {/if}

                    {#if !nodeState.roles[message.role].bot}
                        <button 
                            class="clickable-icon"
                            aria-label="Edit message"
                            disabled={nodeState.inProgress}
                            onclick={() => startEdit()}>
                            <SquarePen size={16}/>
                        </button>
                    {/if}

                    {#if nodeState.roles[message.role].bot}

                        <RunButton
                            inProgress={nodeState.inProgress}
                            label1="Regenarate" 
                            label2="Generating..." 
                            class="clickable-icon",
                            onclick={() => clickGenerate()}
                            Icon={RefreshCcw} />

                    {/if}

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

            </div>
        </div>
        <div class="dialogue-message-body" bind:this={bodyEl}>

            {#if message.id !== nodeState.editId}

                {#if !nodeState.thinkSwitch[message.id]}

                    {#if message.system}
                        <MarkdownRenderer markdown={message.system} label="System" className="system" />
                    {/if}

                    {#if message.private}
                        <MarkdownRenderer markdown={message.private} label="Memory" className="private" />
                        <MarkdownRenderer markdown={message.public} />
                    {:else}
                        <MarkdownRenderer markdown={message.public || message.text} />
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

    <div class="dialogue-message edit" data-text={truncateByLength(`${messageNum}: You → ${nodeState.inputText || '...'}`, 80)}>
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