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

    async getText(app, path)
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

            default:
              text = await app.vault.read(file);
              break;  
        }
        
        return text;
    }

    async getMessage(app, node)
    {        
        const text = await this.getText(app, node);

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

        return this.outlineToString("", "", outline);
    }

    outlineToString(result, tab, outline)
    {
        for (const item of outline)
        {
            result = result + `${tab}- [ ] ${item.title}\n`;
            result = this.outlineToString(result, tab + "\t", item.items);
        }

        return result;
    }
}