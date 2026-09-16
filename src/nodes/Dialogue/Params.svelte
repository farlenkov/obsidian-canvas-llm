<script>

    import RoleParams from './ParamsRole.svelte'

    const { nodeState, viewState } = $props();

    function saveTitle()
    {
        viewState.updateNode(
            nodeState.id,
            { title : nodeState.title },
            "changeDialogueTitle");
    }
    
</script>

<div class="role-list">

    <div class="node-title">
        <input 
            type="text" 
            placeholder="Node title"
            bind:value={nodeState.title}
            onchange={saveTitle}  />
    </div>

    <hr />

    <RoleParams 
        {nodeState} 
        {viewState} 
        index={0} 
        role={nodeState.roles[0]} 
        role2={nodeState.roles[1]} />

    <hr />

    <RoleParams 
        {nodeState} 
        {viewState} 
        index={1} 
        role={nodeState.roles[1]} 
        role2={nodeState.roles[0]} />

</div>