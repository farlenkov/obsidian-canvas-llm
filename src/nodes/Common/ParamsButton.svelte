<script>

    import { Settings } from 'lucide-svelte';
    import { attachHoverMenu } from '$lib/svelte-obsidian/src/Menu.js';

    import EditTitle from './EditTitle.js';

    let { 
        onclick,
        viewState, 
        nodeState,
        getParamsMenu } = $props();

    function getMenuItems() 
    {
        const menuItems = 
        [{
            app : viewState.app, 
            class : 'svelte-llm svelte-obsidian canvas-llm'
        },
            ...(getParamsMenu?.() || 
            [new EditTitle(viewState, nodeState)])
        ];

        return menuItems;
    }

    function onClick()
    {
        if (onclick)
            onclick()
        else
            new EditTitle(viewState, nodeState).onclick();
    }

</script>

<button 
    type="button" 
    class="clickable-icon" 
    aria-label="Open node params" 
    onclick = {onClick}
    {@attach el => attachHoverMenu(el, getMenuItems)}>
    <Settings size={16}/> 
</button>