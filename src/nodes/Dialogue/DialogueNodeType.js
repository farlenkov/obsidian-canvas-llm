import { MessagesSquare } from 'lucide-svelte';
import NodeType from '../Type/NodeType.js';
import NodeView from './DialogueNode.svelte';
import NodeState from './DialogueNode.svelte.js';

export default class DialogueNodeType extends NodeType
{
    id = "dialogue";
    name = "Dialogue";
    desc = "Add node for dialogue simulation";
    view = NodeView;
    state = NodeState;
    icon = MessagesSquare;

    getDefault()
    {
        return {
            type : this.id, 
            width : 460, 
            height : 340, 
            data : 
            { 
                "messages" : {},
                
                "roles" : 
                [{
                    "provider" : "openai",
                    "model" : "gpt-5.4-nano",
                    "name" : "",
                    "bot" : true
                },
                {
                    "provider" : "openai",
                    "model" : "gpt-5.4-nano",
                    "name" : "",
                    "bot" : true
                }]
            }};
    }
}