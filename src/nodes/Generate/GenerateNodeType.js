import { SquarePlayIcon } from 'lucide-svelte';
import settings from '$lib/svelte-llm/settings/Settings.js';
import NodeType from '../Type/NodeType.js';
import NodeView from './GenerateNode.svelte';
import NodeState from './GenerateNode.svelte.js';

export default class GenerateNodeType extends NodeType
{
    id = "generate";
    name = "Generator";
    desc = "Add node for LLM calls";
    view = NodeView;
    state = NodeState;
    icon = SquarePlayIcon;

    getDefault()
    {
        const defaultModel = settings.GetDefaultModel();

        return {
            type : this.id, 
            width : 460, 
            height : 340, 
            data : 
            { 
                results : [], 
                provider : defaultModel.providerId, 
                model : defaultModel.id 
            }};
    }
}