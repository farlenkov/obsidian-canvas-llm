import { compareStrings, escapeXmlAttr } from '$lib/svelte-obsidian/src/String.js';
import { Vault } from 'obsidian';
import FileReader from './FileReader';

export default class FolderReader extends FileReader
{
    constructor(nodeState)
    {
        super(nodeState);
    }

    async read(folder, tabs, preview)
    {
        let result = `${tabs}<folder "name"="${escapeXmlAttr(folder.name)}">\n`;
        const children = [];

        Vault.recurseChildren(folder, async child => 
        {
            if (child.parent === folder)
                children.push(child);

            if (folder.path != child.path)
            {
                const shortpath = child.path.replace(this.nodeState.targetPath + "/", "");

                preview.push
                ({
                    tabs : shortpath.split("/").length - 1,
                    type : child.extension ? "file" : "folder",
                    icon : child.extension ? "" : "📁", //"📃" : "📁", // 📜
                    name : child.basename || child.name,
                    extension : child.extension,
                    shortpath : shortpath,
                    fullpath : child.path
                });
            }
        });

        preview.sort((a, b) => compareStrings(a.fullpath, b.fullpath));
        children.sort((a, b) => compareStrings(a.name, b.name));

        for (const child of children)
        {
            if (!this.nodeState.exclude.includes(child.path))
            {
                const text = await this.nodeState.read(child.path, tabs + '\t');
                result += text;
            }
        }

        result += `${tabs}</folder>\n`;
        return result;
    }
}