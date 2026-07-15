import { escapeXmlAttr } from '$lib/svelte-obsidian/src/String.js';
import FileReader from './FileReader';
import DialogueNodeState from '../../Dialogue/DialogueNode.svelte.js';

export default class CanvasLLMReader extends FileReader
{
    constructor(nodeState)
    {
        super(nodeState);
    }

    async read(file, tabs, preview)
    {
        const text = await this.app.vault.read(file);
        const canvas = JSON.parse(text);

        let result = `${tabs}<canvas "type"="LLM" "name"="${escapeXmlAttr(file.basename)}">\n`;

        if (canvas.nodes)
        {
            // COLLECT REQUIRED IDS

            const requiredIds = {};

            for (const edge of canvas.edges)
            {
                requiredIds[edge.source] = true;
                requiredIds[edge.target] = true;
            }

            // NODES > CARDS

            for (const node of canvas.nodes)
            {
                if (node.type === 'textInput')
                {
                    result += this.renderCard(
                        node.id, 
                        requiredIds, 
                        tabs, 
                        node.data.value, 
                        { 
                            role : "user", 
                            type : node.data.read ? "note" : "prompt", 
                            mode : node.data.template ? "template" : undefined
                        });
                    
                    preview.push(node.data.value);
                }
                else if (node.type === 'fileInput')
                {
                    const text2 = await this.nodeState.read(node.data.path, tabs + '\t\t');

                    if (text2)
                        result += this.renderCard(node.id, requiredIds, tabs, text2, { role : "user", type : "file" });
                    else
                        result += this.renderCard(node.id, requiredIds, tabs, `File: \`${node.file}\``, { role : "user", type : "file" });

                    preview.push(`\`📜 ${node.data.path}\``);
                }
                else if (node.type === 'generate')
                {
                    if (node.data.results && 
                        node.data.results.length > 0)
                    {
                        let part = node.data.results[node.data.part];
                        result += this.renderCard(node.id, requiredIds, tabs, part.text, { role : "assistant", type : "generate", model : part.model });
                        preview.push(`> **${part.model}**\n\n${part.text}`);
                    }
                }
                else if (node.type === 'dialogue')
                {
                    const thread = DialogueNodeState.getThread(
                        node.id,
                        node.data.messages);

                    const roles = 
                    [
                        escapeXmlAttr(node.data.roles[0].name || DialogueNodeState.ROLE_LABELS[0]),
                        escapeXmlAttr(node.data.roles[1].name || DialogueNodeState.ROLE_LABELS[1])
                    ];

                    let dialogue = "";

                    for (let message of thread)
                    {
                        dialogue += 
                            `${tabs}\t\t<message "from"="${roles[message.role]}" "model"="${message.model}">\n` +
                            `${message.text}\n` +
                            `${tabs}\t\t</message>\n`;
                    }

                    result += this.renderCard(
                        node.id, 
                        requiredIds, 
                        tabs, 
                        dialogue, 
                        { 
                            role : "assistant", 
                            type : "dialogue", 
                            role1 : roles[0], 
                            role2 : roles[1]
                        });
                }
            }

            // EDGES

            for (const edge of canvas.edges)
            {
                const socket = edge.targetHandle 
                    ? ` "toSocket"="{{ ${edge.targetHandle} }}" ` 
                    : "";

                result += `${tabs}\t<edge "fromCard"="${edge.source}" "toCard"="${edge.target}"${socket}/>\n`;
            }
        }

        result += `${tabs}</canvas>\n`;
        return result;
    }
}