import providers from "$lib/models/ProviderInfo.svelte.js"
import models from '$lib/models/ModelInfo.svelte.js';

const LINE = "\n\n---\n\n";

class AiClient
{
    async Call(modelId, messages)
    {
        const model = models.index[modelId];

        if (!model)
            throw `[AiClient: Call] Invalid Model ID: ${model.id}`;

        const provider = providers.index[model.providerId];

        if (!provider)
            throw `[AiClient: Call] Invalid Provider ID: ${model.providerId} / ${model.id}`;

        let markdowns = await provider.CallModel(model, messages); 
        const htmls = null;
        return { markdowns, htmls };
    }
}

const aiClient = new AiClient();
export default aiClient;