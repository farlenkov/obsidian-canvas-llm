import { FileUp } from 'lucide-svelte';
import NodeType from '../Type/NodeType.js';
import FileInputNode from './FileInputNode.svelte';

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
            data : { path : "", name : "" }};
    }

    onFileRename(node, file, oldPath)
    {
        let isChanged = false;

        if (node.data.path === oldPath)
        {
            node.data.path = file.path;
            node.data.name = file.name;
            isChanged = true;
        }

        if (node.data.exclude)
        {
            for (let i = 0; i < node.data.exclude.length; i++)
            {
                if (node.data.exclude[i] === oldPath)
                {
                    node.data.exclude[i] = file.path;
                    isChanged = true;
                }
            }
        }
        
        // console.log(`[FileInputNodeType: onFileRename] '${node.data.path}' > '${file.path}'`);        
        return isChanged;
    }
}