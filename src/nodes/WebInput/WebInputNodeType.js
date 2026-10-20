import NodeType from '../Type/NodeType.js';
import NodeView from './WebInputNode.svelte';
import NodeState from './WebInputNode.svelte.js';

export default class WebInputNodeType extends NodeType
{
    id = "webInput";
    name = "Web input";
    desc = "Add node for web content";
    view = NodeView;
    state = NodeState;
    icon = 'globe';
    category = 'input';

    getDefault()
    {
        return {
            type : this.id, 
            width : 260, 
            height : 120, 
            data : { url : "", title : "", value : "" }};
    }
}