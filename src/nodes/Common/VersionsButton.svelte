<script>

    import { attachHoverMenu } from '$lib/svelte-obsidian/src/Menu.js';
    import { truncateByLength } from '$lib/svelte-obsidian/src/String.js';

    let { 
        app,
        class : className, 
        onclick : callback, 
        disabled, 
        versions,
        versionNum } = $props();

    function getContextItems() 
    {
        const menu = 
        [{
            app : app, 
            class : 'svelte-llm svelte-obsidian canvas-llm'
        },
        {
            title : "Versions:", 
            dim : true
        }];

        for (let i = 0; i < versions.length; i++)
        {
            const version = versions[i];
            const text = version.public || version.text;

            const title = version.model
                ? `${i + 1}: ${version.model} → ${text}`
                : `${i + 1}: ${text}`;

            menu.push
            ({
                title : truncateByLength(title, 80),
                accent : i == versionNum,
                onclick : () => callback(i)
            });
        }

        return menu;
  }

</script>

<button 
    class="switch-version {className}"
    {disabled}
    {@attach el => attachHoverMenu(el, getContextItems)}>
    {versionNum + 1}{#if versionNum < versions.length - 1}*{/if}
</button>