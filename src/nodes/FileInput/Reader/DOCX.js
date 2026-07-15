import mammoth from "mammoth";
import TurndownService from "turndown";
import FileReader from './FileReader';

const turndown = new TurndownService
({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced"
});

export default class DocxReader extends FileReader
{
    constructor(nodeState)
    {
        super(nodeState);
    }

    async read(file, tabs, preview)
    {
        const fileBuffer = await this.app.vault.readBinary(file);
        const result = await mammoth.convertToHtml({arrayBuffer: fileBuffer});
        const html = result.value;

        const markdown = turndown.turndown(html)
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]+/g, " ");

        return this.renderFile("document", tabs, file, markdown, preview);
    }
}