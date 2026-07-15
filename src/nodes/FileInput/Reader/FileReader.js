import { escapeXmlAttr } from '$lib/svelte-obsidian/src/String.js';

export default class FileReader
{
    constructor(nodeState)
    {
        this.app = nodeState.app;
        this.nodeState = nodeState;
    }

    renderCard(id, requiredIds, tabs, text, props)
    {
        let attrs = "";

        if (requiredIds[id]) 
            attrs += ` "id"="${id}"`;

        for (let prop in props)
            if (props[prop] !== undefined)
                attrs += ` "${prop}"="${props[prop]}"`;

        if (!/[\n\r]$/.test(text))
            text += "\n";

        return `${tabs}\t<card${attrs}>\n${text}${tabs}\t</card>\n`;
    }

    renderFile(type, tabs, file, text, preview)
    {
        if (!tabs)
        {
            // NOT CANVAS
            preview.push(text);
            return text;
        }
        else
        {
            // IN CANVAS
            return `${tabs}<${type} "name"="${escapeXmlAttr(file.name)}">\n${text}\n${tabs}</${type}>\n`;
        }
    }
}