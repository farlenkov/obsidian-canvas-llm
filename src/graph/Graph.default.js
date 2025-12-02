import settings from '$lib/settings/Settings.svelte.js';
import { createNodeId, createEdgeId } from '$lib/utils/CreateId';

export function defaultGraph()
{
    const node1 = createNodeId();
    const node2 = createNodeId();
    const defaultModel = settings.GetDefaultModel();

    return {
        "nodes": 
        [
            {
                "id": node1,
                "type": "textInput",
                "position": { "x": 20, "y": 0 },
                "data": { "value": "What is LLM?" },
                "width": 180,
                "height": 100
            },
            {
                "id": node2,
                "type": "generate",
                "position": { "x": 240, "y": 0 },
                "width": 460,
                "height": 340,
                "data": {
                    "results": [],
                    "model": defaultModel.id,
                    "provider": defaultModel.providerId
                }
            }
        ],
        "edges": 
        [
            {
                "id": createEdgeId(node1, node2),
                "source": node1,
                "target": node2
            }
        ]};
}

export function defaultTextInput()
{
    return {
        type : "textInput", 
        width : 260, 
        height : 120, 
        data : { value : "" }
    };
}

export function defaultGenerate()
{
    const defaultModel = settings.GetDefaultModel();

    return {
        type : "generate", 
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