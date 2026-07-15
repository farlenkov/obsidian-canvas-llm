import { loadPdfJs } from 'obsidian';
import FileReader from './FileReader';

export default class PdfReader extends FileReader
{
    constructor(nodeState)
    {
        super(nodeState);
    }

    async read(file, tabs, preview)
    {
        const arrayBuffer = await this.app.vault.readBinary(file);
        const uint8Array = new Uint8Array(arrayBuffer);
        const pdfjsLib = await loadPdfJs();

        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;
        const outline = await pdf.getOutline();
        const text = this.outlineToString("", "", outline);

        return this.renderFile('outline', tabs, file, text, preview);
    }

    outlineToString(result, tabs, outline)
    {
        for (const item of outline)
        {
            result = result + `${tabs}- ${item.title}\n`;
            result = this.outlineToString(result, tabs + "\t", item.items);
        }

        return result;
    }
}