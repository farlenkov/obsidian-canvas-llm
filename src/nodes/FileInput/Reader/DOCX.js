import TurndownService from "turndown";
import FileReader from './FileReader';
import { OfficeParser } from 'officeparser';

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
        const binary = await this.app.vault.readBinary(file);
        const buffer = new Uint8Array(binary);

        const ast = await OfficeParser.parseOffice(buffer);
        const { value: markdown, messages } = await ast.to('md');

        return this.renderFile("document", tabs, file, markdown, preview);
    }
}