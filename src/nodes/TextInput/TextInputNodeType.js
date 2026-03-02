import { TextCursorInputIcon } from 'lucide-svelte';
import NodeType from '../Type/NodeType.js';
import TextInputNode from './TextInputNode.svelte';

export default class TextInputNodeType extends NodeType
{
    id = "textInput";
    name = "Text input";
    view = TextInputNode;
    icon = TextCursorInputIcon;

    getDefault()
    {
        return {
            type : this.id, 
            width : 260, 
            height : 120, 
            data : { value : "" }
        };
    }
        
    async getText(app, node)
    {
        const text = node.data.value;
        return text;
    }
        
    async getMessage(app, node)
    {
        const text = await this.getText(app, node);
        return { role : "user", content : [text] };
    }
}