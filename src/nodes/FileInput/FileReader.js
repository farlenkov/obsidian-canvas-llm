import { loadPdfJs } from 'obsidian';
import mammoth from "mammoth";
import TurndownService from "turndown";

const turndown = new TurndownService();

export default class FileReader
{
    openedFiles = {};

    fileReaders = 
    {
        'md'      : async (file, tabs) => await this.readTextFile(file, tabs, "note"),
        'xml'     : async (file, tabs) => await this.readTextFile(file, tabs, "file"),
        'html'    : async (file, tabs) => await this.readTextFile(file, tabs, "file"),
        'json'    : async (file, tabs) => await this.readTextFile(file, tabs, "file"),
        'fountain': async (file, tabs) => await this.readTextFile(file, tabs, "screenplay"),

        'canvas' : async (file, tabs) => await this.readCanvas(file, tabs),
        'docx'   : async (file, tabs) => await this.readDocx(file, tabs),
        'pdf'    : async (file, tabs) => await this.readPdf(file, tabs)
    };

    constructor (app, isPreview)
    {
        this.app = app;
        this.isPreview = isPreview;
        this.supportedExtensions = Object.keys(this.fileReaders);
    }

    async read(path, tabs)
    {
        const file = this.app.vault.getAbstractFileByPath(path);

        if (!file)
            return null;

        if (this.openedFiles[path])
            return;

        tabs = tabs ? tabs : "";
        this.openedFiles[path] = true;

        const reader = this.fileReaders[file.extension];
        const text = reader ? await reader(file, tabs) : "";

        delete this.openedFiles[path];
        return text;
    }

    async readTextFile(file, tabs, type)
    {
        const text = await this.app.vault.read(file);
        return this.renderFile(type, tabs, file, text);
    }

    async readDocx(file, tabs)
    {
        const fileBuffer = await this.app.vault.readBinary(file);
        const result = await mammoth.convertToHtml({arrayBuffer: fileBuffer});
        const html = result.value;

        const markdown = turndown.turndown(html)
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]+/g, " ");

        return this.renderFile("document", tabs, file, markdown);
    }

    async readCanvas(file, tabs)
    {
        const text = await this.app.vault.read(file);
        const canvas = JSON.parse(text);

        let result = "";

        // PREVIEW

        if (this.isPreview)
        {
            if (!canvas.nodes || 
                !canvas.nodes.length)
                return "[empty canvas]";

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

        // FULL CONTENT

        result += `${tabs}<canvas "name"="${this.escapeXmlAttr(file.basename)}">\n\n`;

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
                }
                else if (node.type === 'file')
                {
                    const text2 = await this.read(node.file, tabs + '\t\t');

                    if (text2)
                        result += this.renderCard(node.id, requiredIds, tabs, text2);
                    else
                        result += this.renderCard(node.id, requiredIds, tabs, `File: \`${node.file}\``);
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

        result += `${tabs}</canvas>`;
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
        const text = this.pdfOutlineToString("", "", outline);

        return this.renderFile('pdf-outline', tabs, file, text);
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

    renderCard(id, requiredIds, tabs, text)
    {
        if (requiredIds[id])
            return `${tabs}\t<card "id"="${id}">\n${text}\n${tabs}\t</card>\n\n`;
        else
            return `${tabs}\t<card>\n${text}\n${tabs}\t</card>\n\n`;
    }

    renderFile(type, tabs, file, text)
    {
        return this.isPreview 
            ? text
            : `${tabs}<${type} "name"="${this.escapeXmlAttr(file.name)}">\n${text}\n${tabs}</${type}>`;
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