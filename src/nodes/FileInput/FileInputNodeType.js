import { FileUp } from 'lucide-svelte';
import NodeType from '../Type/NodeType.js';
import FileInputNode from './FileInputNode.svelte';

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

    async getText(app, node)
    {
        const file = app.vault.getAbstractFileByPath(node.data.path);
        
        if (!file)
            return null;
        
        const text = await app.vault.read(file);
        return text;
    }

    async getMessage(app, node)
    {        
        const text = await this.getText(app, node);

        if (!text)
            return null;

        return { role : "user", content : [text] };
    }
}