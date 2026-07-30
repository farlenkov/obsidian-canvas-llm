import { FileUp } from 'lucide-svelte';
import NodeType from '../Type/NodeType.js';
import NodeView from './FileInputNode.svelte';
import NodeState from './FileInputNode.svelte.js';

export default class FileInputNodeType extends NodeType
{
    id = "fileInput";
    name = "File input";
    desc = "Add node for file attachment";
    view = NodeView;
    state = NodeState;
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
            // console.log(`FileInputNodeType: '${node.data.path}' > '${file.path}'`);
            // console.log(`FileInputNodeType: '${node.data.name}' > '${file.name}'`);
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
                    // console.log(`FileInputNodeType: '${node.data.exclude[i]}' > '${file.path}'`);
                    node.data.exclude[i] = file.path;
                    isChanged = true;
                }
            }
        }
        
        // if (isChanged)
        //     console.log(`FileInputNodeType:`, node);

        return isChanged;
    }
}