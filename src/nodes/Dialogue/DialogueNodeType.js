import { MessagesSquare } from 'lucide-svelte';
import NodeType from '../Type/NodeType.js';
import DialogueNode from './DialogueNode.svelte';

export default class DialogueNodeType extends NodeType
{
    id = "dialogue";
    name = "Dialogue";
    desc = "Add node for dialogue simulation";
    view = DialogueNode;
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
                    "name" : ""
                },
                {
                    "provider" : "openai",
                    "model" : "gpt-5.4-nano",
                    "name" : ""
                }]
            }};
    }
}