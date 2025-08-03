import providers from "$lib/models/ProviderInfo.svelte.js"
import models from '$lib/models/ModelInfo.svelte.js';

class AiClient
{
    async Call(providerId, modelId, messages)
    {
        const provider = providers.ById[providerId];
        const model = provider.ModelById[modelId];
        
        if (!provider)
            throw `[AiClient: Call] Invalid Provider ID: ${providerId}`;

        if (!model)
            throw `[AiClient: Call] Invalid Model ID: ${providerId} / ${modelId}`;

        let markdowns = await provider.CallModel(model, messages); 
        const htmls = null;
        return { markdowns, htmls };
    }
}

const aiClient = new AiClient();
export default aiClient;