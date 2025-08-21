import settings from '$lib/settings/Settings.svelte.js';
import Provider from './provider.js';

class SambaNova extends Provider
{
    id = "sambanova";
    name = "SambaNova";
    keys = "https://cloud.sambanova.ai/apis";
    models = "https://cloud.sambanova.ai/plans/pricing";

    // https://docs.sambanova.ai/cloud/api-reference/endpoints/model-list

    GetFetchUrl()
    {
        return "https://api.sambanova.ai/v1/models";
    }

    GetFetchHeaders()
    {
        return {};
    }

    ReadModel(model)
    {
        return { 
            id : model.id,
            name : model.id,
            desc : model.id,
            context : model.context_length,
            owner : model.owned_by || this.name,
            prompt : parseFloat(model.pricing.prompt),
            completion : parseFloat(model.pricing.completion)
        };
    }

    // https://docs.sambanova.ai/cloud/api-reference/endpoints/chat

    GetModelUrl(model)
    {
        return "https://api.sambanova.ai/v1/chat/completions";
    }

    GetModelHeaders()
    {
        return {
            "Content-Type" : "application/json",
            "Authorization" : "Bearer " + settings.Data.sambanovaKey
        };
    }

    ReadResponse(data)
    {            
        if (!data?.choices)
            return [""];

        const result = [];

        data.choices.forEach(choice => 
        {
            const content = choice.message.content;
            const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
            const reasoning = thinkMatch ? thinkMatch[1].trim() : "";
            const response = content.replace(/<think>[\s\S]*?<\/think>/, "").trim();

            if (reasoning)
                result.push(reasoning);

            if (response)
                result.push(response);
        });

        return result;
    }
}

export default new SambaNova();