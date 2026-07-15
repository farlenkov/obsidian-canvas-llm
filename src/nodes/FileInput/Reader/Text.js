import FileReader from './FileReader';

export default class TextReader extends FileReader
{
    constructor(type, nodeState)
    {
        super(nodeState);
        this.type = type;
    }

    async read(file, tabs, preview)
    {
        const text = await this.app.vault.read(file);
        return this.renderFile(this.type, tabs, file, text, preview);
    }
}