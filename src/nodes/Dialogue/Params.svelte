<script>

    import RoleParams from './ParamsRole.svelte'

    const { nodeState, viewState } = $props();
    
</script>

<div class="role-list">

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