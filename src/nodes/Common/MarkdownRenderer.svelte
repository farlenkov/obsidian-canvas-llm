<script>

	import { getContext, onMount } from 'svelte';
    import { MarkdownRenderer } from 'obsidian';

    const { markdown, className } = $props();
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
    bind:this={bodyEl}
    class={"markdown-renderer " + (className ?? "")}></div>