import { loadPdfJs } from 'obsidian';
import { FileUp } from 'lucide-svelte';
import mammoth from "mammoth";
import TurndownService from "turndown";
import NodeType from '../Type/NodeType.js';
import FileInputNode from './FileInputNode.svelte';

const turndown = new TurndownService();

export default class FileInputNodeType extends NodeType
{
    id = "fileInput";
    name = "File input";
    view = FileInputNode;
    icon = FileUp;

    getDefault()
    {
        return {
            type : this.id,
            width : 260,
            height : 120,
            data : { path : "", name : "" }
        };
    }

    async getPreview(app, node)
    {
        return await this.getContent(app, node, true);
    }

    async getContent(app, path, isPreview)
    {
        if (typeof path !== 'string')
            path = path.data.path; // path is node

        const file = app.vault.getAbstractFileByPath(path);

        if (!file)
            return null;

        let text;

        switch(file.extension)
        {
            case 'docx':
              text = await this.readDocx(app, file);
              break;

            case 'pdf':
              text = await this.readPdf(app, file);
              break;

            case 'canvas':
              text = isPreview 
                ? await this.readCanvasPreview(app, file) 
                : await this.readCanvas(app, file);
              break;

            default:
              text = await app.vault.read(file);
              break;
        }

        return text;
    }

    async getMessage(app, node)
    {
        const text = await this.getContent(app, node);

        if (!text)
            return null;

        return { role : "user", content : [text] };
    }

    async readDocx(app, file)
    {
        const fileBuffer = await app.vault.readBinary(file);
        const result = await mammoth.convertToHtml({arrayBuffer: fileBuffer});
        const html = result.value;

        const markdown = turndown.turndown(html)
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]+/g, " ");

        return markdown;
    }

    async readPdf(app, file)
    {
        const arrayBuffer = await app.vault.readBinary(file);
        const uint8Array = new Uint8Array(arrayBuffer);
        const pdfjsLib = await loadPdfJs();

        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;
        const outline = await pdf.getOutline();

        return this.pdfOutlineToString("", "", outline);
    }

    async readCanvasPreview(app, file)
    {
        const text = await app.vault.read(file);
        const canvas = JSON.parse(text);
        let result = "";

        for (let i = 0; i < canvas.nodes.length; i++)
        {
            const node = canvas.nodes[i];
            
            if (node.type === 'text')
            {
                result += node.text;

                if (i < canvas.nodes.length - 1)
                    result += "\n\n ≻ — — — — — ≺ \n\n";
            }
        }

        return result;
    }

    async readCanvas(app, file)
    {
        const text = await app.vault.read(file);
        const canvas = JSON.parse(text);
        const idMap = {};
        const includedNodes = {};

        for (let i = 0; i < canvas.nodes.length; i++)
            idMap[canvas.nodes[i].id] = i + 1;

        let result = `<canvas "name"="${this.escapeXmlAttr(file.basename)}">\n\n`;

        for (const node of canvas.nodes)
        {
            if (node.type === 'text')
            {
                includedNodes[node.id] = true;
                result += `\t<card "id"="${idMap[node.id]}">\n${node.text}\n\t</card>\n\n`;
            }
        }

        for (const edge of canvas.edges)
        {
            if (!includedNodes[edge.fromNode] ||
                !includedNodes[edge.toNode])
                continue;

            const type = edge.toEnd === 'none'
                ? "Nondirectional"
                : edge.fromEnd === 'arrow'
                    ? "Bidirectional"
                    : "Unidirectional";

            const label = edge.label ? ` "label"="${edge.label}" ` : "";

            result += `\t<edge "fromCard"="${idMap[edge.fromNode]}" "toCard"="${idMap[edge.toNode]}" "type"="${type}"${label}/>\n`;
        }

        result += '\n</canvas>';
        return result;
    }

    pdfOutlineToString(result, tab, outline)
    {
        for (const item of outline)
        {
            result = result + `${tab}- [ ] ${item.title}\n`;
            result = this.pdfOutlineToString(result, tab + "\t", item.items);
        }

        return result;
    }

    escapeXmlAttr(value) 
    {
        return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}