<script>

    import { XIcon } from 'lucide-svelte';
    let { onclick } = $props();

	function handleKeydown(event) 
    {
		if (event.key === "Escape")
            onclick();
	}

</script>

<svelte:window onkeydown={handleKeydown} />

<button type="button" class="btn-dark" {onclick}>
    <XIcon size={48} strokeWidth={1}/>
    Close
</button>

<style>

    .btn-dark
    {
        position: absolute;
        bottom: 3em;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 0.25em 0.9em 0.25em 0.5em;
        font-size: 1.2em;

        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 0.25em;
    }

</style>