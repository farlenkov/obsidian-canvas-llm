<script>

    const { content, view } = $props();

    content.sort((a,b) => 
    {
        return b.update_time - a.update_time;
    });

</script>

{#each content as chat, i}
    {@const updated = moment(chat.create_time * 1000).format('DD-MM-YYYY')}

    <div>
        {updated} - {chat.title} 
    </div>
{/each}