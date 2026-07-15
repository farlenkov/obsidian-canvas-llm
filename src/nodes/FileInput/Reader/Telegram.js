import { unixToStr } from '$lib/svelte-obsidian/src/Date.js';
import { escapeXmlAttr } from '$lib/svelte-obsidian/src/String.js';
import FileReader from './FileReader';

export default class TelegramReader extends FileReader
{
    constructor(nodeState)
    {
        super(nodeState);
    }

    async read(file, tabs, preview)
    {
        const text = await this.app.vault.read(file);
        const chat = JSON.parse(text);
        const posts = chat.posts;

        if (!posts)
            return "";

        let result = `${tabs}<messages "name"="${escapeXmlAttr(file.basename)}">\n`;

        for (const post of posts)
        {
            if (!post.Markdown)
                continue;

            const userId = post.Raw.from_id 
                ? post.Raw.from_id.user_id 
                    ? post.Raw.from_id.user_id 
                    : post.Raw.from_id.channel_id
                : post.Raw.peer_id.channel_id;

            const replyTo = post.Raw.reply_to
                ? `"reply_to_msg_id"="${post.Raw.reply_to.reply_to_msg_id}"`
                : "";

            const message = 
                `${tabs}\t<message "id"="${post.Raw.id}" "user"="${userId}" "time"="${unixToStr(post.Time)}" ${replyTo}>\n`+
                `${post.Markdown}\n`+
                `${tabs}\t</message>\n`;

            result += message;
            preview.push(post.Markdown);
        }

        result += `${tabs}</messages>\n`;
        return result;
    }
}