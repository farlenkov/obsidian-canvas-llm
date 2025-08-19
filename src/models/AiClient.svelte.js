import providers from "$lib/models/ProviderInfo.svelte.js"

class AiClient
{
    async Call(providerId, modelId, messages)
    {
        // GET PROVIDER

        const provider = providers.ById[providerId];
        const model = provider.ModelById[modelId];
        
        if (!provider)
            throw `[AiClient: Call] Invalid Provider ID: ${providerId}`;

        if (!model)
            throw `[AiClient: Call] Invalid Model ID: ${providerId} / ${modelId}`;

        // CALL PROVIDER

        let markdowns = await provider.CallModel(model, messages);

        if (!markdowns.some(md => md != ""))
            throw "API provider respond with empty message.";

        return { markdowns };
    }
}

const aiClient = new AiClient();
export default aiClient;