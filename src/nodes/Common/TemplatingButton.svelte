<script>

    import { Braces } from 'lucide-svelte';
    import GenericButton from './GenericButton.svelte';

    const { nodeState, onclick: callback } = $props();

    function onclick()
    {
        nodeState.toggleTemplate();
    }

</script>

<GenericButton 
    {onclick} 
    isActive={nodeState.isTemplate} 
    icon={Braces} 
    label="Use templating" />