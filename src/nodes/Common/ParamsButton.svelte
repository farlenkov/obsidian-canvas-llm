<script>

    import { Menu, Settings } from 'lucide-svelte';
    let { onclick } = $props();

</script>

<button 
    type="button" 
    class="clickable-icon" 
    aria-label="Open node params" 
    {onclick}>
    <Settings size={16}/> 
</button>