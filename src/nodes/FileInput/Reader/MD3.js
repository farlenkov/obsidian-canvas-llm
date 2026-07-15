import FileReader from './FileReader';

export default class Md3Reader extends FileReader
{
    constructor(nodeState)
    {
        super(nodeState);
    }

    async read(file, tabs, preview)
    {
        const text = await this.app.vault.read(file);
        const tree = JSON.parse(text);

        let result = `### ${tree.name}`;
        result += this.outlineToString(result, "", tree.children); 
        return this.renderFile('book', tabs, file, result, preview);
    }

    outlineToString(result, tabs, tree)
    {
        for (const item of tree)
        {
            result = result + `\n${tabs}- ${item.name}`;
            result = this.outlineToString(result, tabs + "\t", item.children);
        }

        return result;
    }
}