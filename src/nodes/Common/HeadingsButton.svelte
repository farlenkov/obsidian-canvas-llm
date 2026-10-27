<script>

    import { onMount } from 'svelte';
    import { List } from 'lucide-svelte';
    import { attachHoverMenu } from '$lib/svelte-obsidian/src/Menu.js';
    import { truncateByLength } from '$lib/svelte-obsidian/src/String.js';

    let { 
        app, 
        title,
        bodyEl,
        selector,
        class : className, 
        onclick : callback,
        refresh : onRefresh } = $props();

    let headings = $state([]);

    onMount(async () => 
    {
        await sleep(100);
        readHeadings();
    });

    onRefresh?.(async () => 
    {
        await sleep(100);
        readHeadings();
    });

    function readHeadings()
    {
        if (!bodyEl)
            return;

        if (selector)
            headings = [...bodyEl.querySelectorAll(selector)];
        else
            headings = [...bodyEl.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')];
    }

    function getContextItems() 
    {
        readHeadings();

        const menu = 
        [{
            app : app, 
            class : 'svelte-llm svelte-obsidian canvas-llm'
        },
        { 
            title : title || "Outline:", 
            dim : true 
        }];

        for (const heading of headings)
        {
            menu.push
            ({
                title : truncateByLength(heading.dataset.text || heading.innerText, 80),
                onclick : () => callback(heading)
            });
        }

        return menu;
    }

</script>

{#if headings.length > 0}
    <button 
        class="{className}"
        {@attach el => attachHoverMenu(el, getContextItems)}>
        <List size={16}/>
    </button>
{/if}