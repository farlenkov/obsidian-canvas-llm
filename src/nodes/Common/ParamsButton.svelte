<script>

    import { Menu } from 'lucide-svelte';
    let { onclick } = $props();

</script>

<button 
    type="button" 
    class="clickable-icon" 
    aria-label="Open node params" 
    {onclick}>
    <Menu size={16}/> 
</button>

<style>

    .btn-dark 
    {
        border-radius: 0.5em;
        padding: 0.25em;
    }

</style>