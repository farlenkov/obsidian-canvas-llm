import settings from '$lib/overlay/Settings.svelte.js';
import Provider from './provider.js';

class OpenRouter extends Provider
{
    id = "openrouter";
    name = "OpenRouter";
    keys = "https://openrouter.ai/settings/keys";
    models = "https://openrouter.ai/models";
    price = true;

    GetFetchUrl()
    {
        return "https://openrouter.ai/api/v1/models";
    }

    GetFetchHeaders()
    {
        return {};
    }

    ReadModel(model)
    {
        return { 
            id : model.id,
            name : model.name,
            desc : model.description,
            context : model.context_length,
            owner : model.owned_by || this.name,
            prompt : parseFloat(model.pricing.prompt),
            completion : parseFloat(model.pricing.completion)
        };
    }

    // https://openrouter.ai/docs/quick-start

    GetModelUrl(model)
    {
        return "https://openrouter.ai/api/v1/chat/completions";
    }

    GetModelHeaders()
    {
        return {
            "Content-Type" : "application/json",
            "Authorization" : "Bearer " + settings.Data.openrouterKey
        };
    }
}

export default new OpenRouter();