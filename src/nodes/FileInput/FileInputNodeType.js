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
}