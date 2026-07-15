import { escapeXmlAttr } from '$lib/svelte-obsidian/src/String.js';
import FileReader from './FileReader';

export default class CanvasReader extends FileReader
{
    constructor(nodeState)
    {
        super(nodeState);
    }

    async read(file, tabs, preview)
    {
        const text = await this.app.vault.read(file);
        const canvas = JSON.parse(text);

        let result = `${tabs}<canvas "name"="${escapeXmlAttr(file.basename)}">\n`;

        if (canvas.nodes)
        {
            // COLLECT REQUIRED IDS

            const requiredIds = {};

            for (const edge of canvas.edges)
            {
                requiredIds[edge.fromNode] = true;
                requiredIds[edge.toNode] = true;
            }

            // NODES > CARDS

            for (const node of canvas.nodes)
            {
                if (node.type === 'text')
                {
                    result += this.renderCard(node.id, requiredIds, tabs, node.text);
                    preview.push(node.text);
                }
                else if (node.type === 'file')
                {
                    const text2 = await this.nodeState.read(node.file, tabs + '\t\t');

                    if (text2)
                        result += this.renderCard(node.id, requiredIds, tabs, text2);
                    else
                        result += this.renderCard(node.id, requiredIds, tabs, `File: \`${node.file}\``);

                    preview.push(`\`📜 ${node.file}\``);
                }
            }

            // EDGES

            for (const edge of canvas.edges)
            {
                const type = edge.toEnd === 'none'
                    ? "Nondirectional"
                    : edge.fromEnd === 'arrow'
                        ? "Bidirectional"
                        : "Unidirectional";

                const label = edge.label 
                    ? ` "label"="${edge.label}" ` 
                    : "";

                result += `${tabs}\t<edge "fromCard"="${edge.fromNode}" "toCard"="${edge.toNode}" "type"="${type}"${label}/>\n`;
            }
        }

        result += `${tabs}</canvas>\n`;
        return result;
    }
}