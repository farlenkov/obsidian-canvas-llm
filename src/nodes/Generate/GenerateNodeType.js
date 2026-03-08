import { SquarePlayIcon } from 'lucide-svelte';
import settings from '$lib/svelte-llm/settings/Settings.svelte.js';
import NodeType from '../Type/NodeType.js';
import GenerateNode from './GenerateNode.svelte';

export default class GenerateNodeType extends NodeType
{
    id = "generate";
    name = "Generator";
    desc = "Add node for LLM calls";
    view = GenerateNode;
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
            }
        };
    }

    async getPreview(app, node)
    {
        throw 'not implemented'
    }

    async getContent(app, node, getThink)
    {
        const result = node.data.results[node.data.part];
        const text = getThink ? result.think : result.text;
        return text;
    }
    
    async getMessage(app, node)
    {
        const text = await this.getContent(app, node);
        return { role : "model", content : [text] };
    }
}