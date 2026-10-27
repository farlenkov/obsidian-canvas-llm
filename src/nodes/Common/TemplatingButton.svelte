<script>

    import { Braces } from 'lucide-svelte';
    import GenericButton from './GenericButton.svelte';

    const { viewState, nodeState } = $props();

    function onclick()
    {
        nodeState.isTemplate = !nodeState.isTemplate;
        nodeState.updateNodeInternals.emit(this.nodeState.id);

        viewState.updateNode(
            nodeState.id, 
            { template : nodeState.isTemplate }, 
            "TemplateMode");
    }

</script>

<GenericButton 
    {onclick} 
    isActive={nodeState.isTemplate} 
    icon={Braces} 
    label={"Enable templating.\nType {{ name }} to insert a placeholder."} />