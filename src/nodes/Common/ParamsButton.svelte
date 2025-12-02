<script>

    import { Settings } from 'lucide-svelte';
    let { onclick } = $props();

</script>

<button 
    type="button" 
    class="show-params clickable-icon" 
    aria-label="Open node params" 
    {onclick}>
    <Settings size={16}/> 
</button>