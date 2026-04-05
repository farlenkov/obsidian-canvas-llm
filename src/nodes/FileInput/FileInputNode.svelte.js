import NodeState from '../Common/NodeState.svelte.js';
import { loadPdfJs } from 'obsidian';
import { EPub } from "epub2";
import mammoth from "mammoth";
import TurndownService from "turndown";

const turndown = new TurndownService
({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced"
});

export default class FileInputNodeState extends NodeState
{
    constructor(id, data, appState, updateNodeInternals)
    {
        super(id, data, appState, updateNodeInternals);

        this.preview = $state([]);
        this.openedFiles = {};
        this.supportedExtensions = Object.keys(this.fileReaders);
    }

    fileReaders = 
    {
        'md'      : async (file, tabs) => await this.readTextFile(file, tabs, "note"),
        'xml'     : async (file, tabs) => await this.readTextFile(file, tabs, "file"),
        'html'    : async (file, tabs) => await this.readTextFile(file, tabs, "file"),
        'json'    : async (file, tabs) => await this.readTextFile(file, tabs, "file"),
        'fountain': async (file, tabs) => await this.readTextFile(file, tabs, "screenplay"),

        'canvas' : async (file, tabs) => await this.readCanvas(file, tabs),
        'docx'   : async (file, tabs) => await this.readDocx(file, tabs),
        // 'epub'   : async (file, tabs) => await this.readEpub(file, tabs),
        'pdf'    : async (file, tabs) => await this.readPdf(file, tabs),
        'md3'    : async (file, tabs) => await this.readMd3(file, tabs)
    };

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
        const text = await reader(file, tabs);
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

    // async readEpub(file, tabs)
    // {
    //     const fileBuffer = await this.app.vault.readBinary(file);
    //     const epub = await EPub.createAsync(file.path);
    //     const chapters = [];

    //     for (const item of epub.flow) 
    //     {
    //         const [html] = await epub.getChapterRawAsync(item.id);
    //         const markdown = td.turndown(html);
    //         console.log(markdown);
    //         return;
    //         chapters.push(markdown);
    //     }

    //     return chapters.join("\n\n---\n\n"); // join chapters with divider
    // }

    async readCanvas(file, tabs)
    {
        const text = await this.app.vault.read(file);
        const canvas = JSON.parse(text);

        // FULL CONTENT

        let preview = [];
        let result = "";        
        result += `${tabs}<canvas "name"="${this.escapeXmlAttr(file.basename)}">\n`;

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
                    const text2 = await this.read(node.file, tabs + '\t\t');

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

        if (!tabs)
            this.preview = preview;

        result += `${tabs}</canvas>`;
        return result;
    }

    async readMd3(file, tabs)
    {
        const text = await this.app.vault.read(file);
        const tree = JSON.parse(text);

        let result = `### ${tree.name}`;
        result += this.md3OutlineToString(result, "", tree.children); 
        return this.renderFile('book', tabs, file, result);
    }

    md3OutlineToString(result, tabs, tree)
    {
        for (const item of tree)
        {
            result = result + `\n${tabs}- ${item.name}`;
            result = this.md3OutlineToString(result, tabs + "\t", item.children);
        }

        return result;
    }

    async readPdf(result, tabs)
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
            return `${tabs}\t<card "id"="${id}">\n${text}\n${tabs}\t</card>\n`;
        else
            return `${tabs}\t<card>\n${text}\n${tabs}\t</card>\n`;
    }

    renderFile(type, tabs, file, text)
    {
        if (!tabs)
        {
            // NOT CANVAS
            this.preview = [text];
            return text;
        }
        else
        {
            // IN CANVAS
            return `${tabs}<${type} "name"="${this.escapeXmlAttr(file.name)}">\n${text}\n${tabs}</${type}>`;
        }
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