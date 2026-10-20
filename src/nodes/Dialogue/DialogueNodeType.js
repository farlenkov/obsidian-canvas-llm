import settings from '$lib/svelte-llm/settings/Settings.svelte.js';
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
    icon = 'messages-square';
    category = 'output';

    getDefault()
    {
        const defaultModel = settings.GetDefaultModel();

        return {
            type : this.id, 
            width : 460, 
            height : 340, 
            data : 
            { 
                "messages" : {},
                
                "roles" : 
                [{
                    "provider" : defaultModel.providerId,
                    "model" : defaultModel.id,
                    "name" : "User",
                    "bot" : false
                },
                {
                    "provider" : defaultModel.providerId,
                    "model" : defaultModel.id,
                    "name" : "Assist",
                    "bot" : true,
                    "auto" : true,
                    "memory" : true
                }]
            }};
    }
}