<script>

	import { getContext, onMount } from 'svelte';
    import { MarkdownRenderer } from 'obsidian';

    const { markdown, className, label } = $props();
    const appState = getContext("appState");
    let bodyEl;

    onMount(() => 
    { 
        if (markdown)
            renderHtml();
    });

    $effect(() => 
    { 
        renderHtml();
    });

    function renderHtml()
    {
        bodyEl.empty();

        MarkdownRenderer.render(
            appState.app, 
            markdown, 
            bodyEl, 
            appState.view.file.path, 
            appState.view);
    }

</script>

<div 
    aria-label={label}
    bind:this={bodyEl}
    class={"markdown-renderer " + (className ?? "")}></div>