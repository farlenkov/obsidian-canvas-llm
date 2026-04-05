<script>

    import { Handle, Position } from '@xyflow/svelte';

    let { placeholders, class: className } = $props();

</script>

<Handle 
    type="target" 
    position={Position.Left} 
    aria-label="Prev message → ○"
    class={className} />

<Handle 
    type="source" 
    position={Position.Right} 
    aria-label="○ → Next message"
    class={className} />

{#each placeholders as placeholder, index}

    <Handle 
        type="target" 
        id={placeholder} 
        position={Position.Left} 
        class={className} 
        aria-label={`{{ ${placeholder} }}`}
        style="top:{3 + index}em !important"/>

{/each}