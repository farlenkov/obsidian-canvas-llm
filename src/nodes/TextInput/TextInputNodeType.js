import { TextCursorInputIcon } from 'lucide-svelte';
import NodeType from '../Type/NodeType.js';
import NodeView from './TextInputNode.svelte';
import NodeState from './TextInputNode.svelte.js';

export default class TextInputNodeType extends NodeType
{
    id = "textInput";
    name = "Text input";
    desc = "Add node for basic text prompts";
    view = NodeView;
    state = NodeState;
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