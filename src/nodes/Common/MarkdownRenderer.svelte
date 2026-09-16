<script>

	import { getContext, onMount } from 'svelte';
    import { MarkdownRenderer } from 'obsidian';

    const { markdown, className, label } = $props();
    const viewState = getContext("viewState");
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
            viewState.app, 
            markdown, 
            bodyEl, 
            viewState.file.path, 
            viewState);
    }

</script>

<div 
    title={label}
    bind:this={bodyEl}
    class={"markdown-renderer " + (className ?? "")}></div>