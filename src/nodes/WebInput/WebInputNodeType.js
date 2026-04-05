import { Globe } from 'lucide-svelte';
import NodeType from '../Type/NodeType.js';
import WebInputNode from './WebInputNode.svelte';

export default class WebInputNodeType extends NodeType
{
    id = "webInput";
    name = "Web input";
    desc = "Add node for web content";
    view = WebInputNode;
    icon = Globe;

    getDefault()
    {
        return {
            type : this.id, 
            width : 260, 
            height : 120, 
            data : { url : "", title : "", value : "" }};
    }
}