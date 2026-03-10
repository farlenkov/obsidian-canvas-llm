import { FileUp } from 'lucide-svelte';
import NodeType from '../Type/NodeType.js';
import FileInputNode from './FileInputNode.svelte';
import FileReader from './FileReader.js';

export default class FileInputNodeType extends NodeType
{
    id = "fileInput";
    name = "File input";
    desc = "Add node for file attachment";
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

    async getPreview(app, node)
    {
        return await this.getContent(app, node, true);
    }

    async getContent(app, path, isPreview)
    {
        if (typeof path !== 'string')
            path = path.data.path; // path is node

        const reader = new FileReader(app, isPreview);
        const text = await reader.read(path);
        return text;
    }

    async getMessage(app, node)
    {
        const text = await this.getContent(app, node);

        if (!text)
            return null;

        return { role : "user", content : [text] };
    }
}