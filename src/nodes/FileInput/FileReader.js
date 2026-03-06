import { loadPdfJs } from 'obsidian';
import mammoth from "mammoth";
import TurndownService from "turndown";

export default class FileReader
{
    openedFiles = {};

    constructor (app, isPreview)
    {
        this.app = app;
        this.isPreview = isPreview;
    }

    async read(path, tabs)
    {
        const file = this.app.vault.getAbstractFileByPath(path);

        if (!file)
            return null;

        if (this.openedFiles[path])
            return;

        this.openedFiles[path] = true;
        let text;

        switch (file.extension)
        {
            case 'docx':
              text = await this.readDocx(file);
              break;

            case 'pdf':
              text = await this.readPdf(file);
              break;

            case 'canvas':
              text = this.isPreview 
                ? await this.readCanvasPreview(file) 
                : await this.readCanvas(file, tabs);
              break;

            case 'md':
            case 'json':
            case 'xml':
            case 'html':
            case 'fountain':
              text = await this.app.vault.read(file);
              break;
        }

        delete this.openedFiles[path];
        return text;
    }

    async readDocx(file)
    {
        const fileBuffer = await this.app.vault.readBinary(file);
        const result = await mammoth.convertToHtml({arrayBuffer: fileBuffer});
        const html = result.value;
        const turndown = new TurndownService();

        const markdown = turndown.turndown(html)
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]+/g, " ");

        return markdown;
    }

    async readCanvasPreview(file)
    {
        const text = await this.app.vault.read(file);
        const canvas = JSON.parse(text);
        let result = "";

        for (let i = 0; i < canvas.nodes.length; i++)
        {
            const node = canvas.nodes[i];
            
            if (node.type === 'text')
                result += node.text;
            else if (node.type === 'file')
                result += `\`\`\`\n${node.file}\n\`\`\``;                

            if (i < canvas.nodes.length - 1)
                result += "\n\n ≻ — — — — — ≺ \n\n";
        }

        return result;
    }

    async readCanvas(file, tabs)
    {
        const text = await this.app.vault.read(file);
        const canvas = JSON.parse(text);
        const idMap = {};
        const includedNodes = {};

        tabs = tabs ? tabs : "";

        for (let i = 0; i < canvas.nodes.length; i++)
            idMap[canvas.nodes[i].id] = i + 1;

        let result = `${tabs}<canvas "name"="${this.escapeXmlAttr(file.basename)}">\n\n`;

        for (const node of canvas.nodes)
        {
            includedNodes[node.id] = true;

            if (node.type === 'text')
            {
                result += `${tabs}\t<card "id"="${idMap[node.id]}">\n${node.text}\n${tabs}\t</card>\n\n`;
            }
            else if (node.type === 'file')
            {
                const file2 = this.app.vault.getAbstractFileByPath(node.file);
                const text2 = await this.read(node.file, tabs + '\t\t');

                if (text2)
                    result += `${tabs}\t<card "id"="${idMap[node.id]}" "name"="${file2.basename}">\n${text2}\n${tabs}\t</card>\n\n`;
                else
                    result += `${tabs}\t<card "id"="${idMap[node.id]}">\nFile: \`${node.file}\`\n${tabs}\t</card>\n\n`;             
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

            result += `${tabs}\t<edge "fromCard"="${idMap[edge.fromNode]}" "toCard"="${idMap[edge.toNode]}" "type"="${type}"${label}/>\n`;
        }

        result += `${tabs}</canvas>`;
        console.log(result);
        return result;
    }

    async readPdf(file)
    {
        const arrayBuffer = await this.app.vault.readBinary(file);
        const uint8Array = new Uint8Array(arrayBuffer);
        const pdfjsLib = await loadPdfJs();

        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;
        const outline = await pdf.getOutline();

        return this.pdfOutlineToString("", "", outline);
    }

    pdfOutlineToString(result, tabs, outline)
    {
        for (const item of outline)
        {
            result = result + `${tabs}- ${item.title}\n`;
            result = this.pdfOutlineToString(result, tabs + "\t", item.items);
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
