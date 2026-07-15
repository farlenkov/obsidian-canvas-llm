<script>

    import RoleParams from './ParamsRole.svelte'

    const { nodeState } = $props();
    
</script>

<div class="role-list">

    <RoleParams 
        {nodeState} 
        index={0} 
        role={nodeState.roles[0]} 
        role2={nodeState.roles[1]} />

    <hr />

    <RoleParams 
        {nodeState} 
        index={1} 
        role={nodeState.roles[1]} 
        role2={nodeState.roles[0]} />

</div>