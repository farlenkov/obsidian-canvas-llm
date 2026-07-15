<script>

    const { content, view } = $props();

</script>

<ul>
    {#each content.toReversed() as chat, i}
        {@const updated = moment(chat.updated_at).format('DD-MM-YYYY')}

        <li>
            {chat.title} ({updated})
        </li>
    {/each}
</ul>