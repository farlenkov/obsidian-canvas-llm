<script>

    import { RefreshCcw, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import RunButton from './RunButton.svelte';

    const {nodeState, message, messageNum} = $props();

    async function clickCopy(ev)
    {
        const copyText = await nodeState.getCopy(ev.shiftKey, message);
        navigator.clipboard.writeText(copyText);
    }

    function getRoleName(message)
    {
        const role = nodeState.roles[message.role];
        const roleName = role.name || nodeState.ROLE_LABELS[message.role];
        return roleName;
    }

</script>

<div class="dialogue-message">
    <div class="dialogue-message-head">
        <div 
            class="dialogue-message-role"
            aria-label={message.model}>
                <span class="dialogue-message-num">#{messageNum+1}</span> 
                <span class="dialogue-message-role-name">{@html getRoleName(message)}</span>
        </div>
        <div class="dialogue-message-buttons">

            {#if nodeState.hasVariations(message.parentId)}
                <div class="dialogue-message-variants">

                    <button 
                        class="clickable-icon"
                        aria-label="Prev variation"
                        disabled={nodeState.inProgress}
                        onclick={() => nodeState.switchVariation(message, -1)}>
                        <ChevronLeft size={16}/>
                    </button>

                    {nodeState.VariantNum[message.id]}
                    / 
                    {nodeState.messages[message.parentId].length}

                    <button 
                        class="clickable-icon"
                        aria-label="Next variation"
                        disabled={nodeState.inProgress}
                        onclick={() => nodeState.switchVariation(message, 1)}>
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
            
            <CopyTextButton 
                label="Copy message" 
                onclick={clickCopy} />

            <RunButton
                inProgress={nodeState.inProgress}
                label1="Regenarate" 
                label2="Generating..." 
                class="clickable-icon",
                onclick={() => nodeState.generate(message)}
                Icon={RefreshCcw} />

        </div>
    </div>
    <div class="dialogue-message-body">
        {#if !nodeState.thinkSwitch[message.id]}
            <MarkdownRenderer markdown={message.text} />
        {:else}
            <MarkdownRenderer markdown={message.think} />
        {/if}
    </div>
</div>