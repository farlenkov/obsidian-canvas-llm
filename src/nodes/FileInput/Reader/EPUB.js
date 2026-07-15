import FileReader from './FileReader';
import { EPub } from "epub2";

export default class EpubReader extends FileReader
{
    constructor(nodeState)
    {
        super(nodeState);
    }

    // async read(file, tabs, preview)
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
}