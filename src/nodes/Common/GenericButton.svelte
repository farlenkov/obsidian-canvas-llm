<script>

    let { onclick, isActive, label, icon: Icon, disabled } = $props();

</script>

<button 
    type="button" 
    class="clickable-icon" 
    aria-label={label} 
    class:color-text-accent={isActive}
    {onclick}
    {disabled}>

    <Icon size={16} />
</button>