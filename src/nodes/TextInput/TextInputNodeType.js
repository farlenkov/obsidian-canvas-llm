import { TextCursorInputIcon } from 'lucide-svelte';
import NodeType from '../Type/NodeType.js';
import TextInputNode from './TextInputNode.svelte';

export default class TextInputNodeType extends NodeType
{
    id = "textInput";
    name = "Text input";
    desc = "Add node for basic text prompts";
    view = TextInputNode;
    icon = TextCursorInputIcon;

    getDefault()
    {
        return {
            type : this.id, 
            width : 260, 
            height : 120, 
            data : { value : "" }};
    }
}