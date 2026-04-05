<script>

    let { onclick, isActive, label, icon: Icon } = $props();

</script>

<button 
    type="button" 
    class="clickable-icon" 
    aria-label={label} 
    class:color-text-accent={isActive}
    {onclick}>

    <Icon size={16} />
</button>