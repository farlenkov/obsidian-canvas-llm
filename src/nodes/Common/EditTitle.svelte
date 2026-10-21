<script>

    const { nodeState, viewState } = $props();
    
    function saveIcon()
    {
        viewState.updateNode(
            nodeState.id,
            { noicon : this.showIcon ? false : true },
            "changeIcon");
    }

    function saveTitle()
    {
        viewState.updateNode(
            nodeState.id,
            { title : nodeState.title },
            "changeTitle");
    }
    
</script>

<label class="node-icon">
    
    <input
        type="checkbox"
        bind:checked={nodeState.showIcon}
        onchange={saveIcon}>

    Show icon

</label>

<div class="node-title">

    <input 
        type="text" 
        placeholder="Node title"
        bind:value={nodeState.title}
        onchange={saveTitle}  />
</div>