<script>

    import { Handle, Position } from '@xyflow/svelte';

    let { inputs, class: className } = $props();

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

{#each inputs as input, index}

    {#if typeof input === 'string'}

        <Handle 
            type="target" 
            id={input} 
            position={Position.Left} 
            class={className} 
            aria-label={`${input}`}
            style="top:{3 + index}em !important"/>

    {:else}

        <Handle 
            type="target" 
            id={Object.keys(input)[0]} 
            position={Position.Left} 
            class={className} 
            aria-label={`${input[Object.keys(input)[0]]}`}
            style="top:{3 + index}em !important"/>

    {/if}

{/each}