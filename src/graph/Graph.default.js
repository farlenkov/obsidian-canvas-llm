import settings from '$lib/overlay/Settings.svelte.js';
import {CreateNodeId, CreateEdgeId} from '$lib/utils/CreateId';

export default function creteDefaultGraph()
{
    const node1 = CreateNodeId();
    const node2 = CreateNodeId();
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
                    "markdowns": [],
                    "model": defaultModel.id,
                    "provider": defaultModel.providerId
                }
            }
        ],
        "edges": 
        [
            {
                "id": CreateEdgeId(node1, node2),
                "source": node1,
                "target": node2
            }
        ]};
}