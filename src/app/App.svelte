<script>

    import { setContext } from 'svelte';

    import Graph from '$lib/graph/Graph.svelte';
    import Overlay from '$lib/overlay/Overlay.svelte';
    
    const { appState } = $props();
    setContext("appState", appState);

</script>

<Graph />
<Overlay />
