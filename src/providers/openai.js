import settings from '$lib/settings/Settings.svelte.js';
import Provider from './provider.js';

class OpenAI extends Provider
{
    id = "openai";
    name = "OpenAI";
    keys = "https://platform.openai.com/api-keys";
    models = "https://platform.openai.com/docs/pricing";

    // https://platform.openai.com/docs/api-reference/models/list

    GetFetchUrl()
    {
        return "https://api.openai.com/v1/models";
    }

    GetFetchHeaders()
    {
        return {
            "Content-Type" : "application/json",
            "Authorization" : "Bearer " + settings.Data.openaiKey
        };
    }

    // https://platform.openai.com/docs/guides/text-generation#conversations-and-context
    // https://platform.openai.com/docs/quickstart?language-preference=curl

    GetModelUrl(model)
    {
        return "https://api.openai.com/v1/chat/completions";
    }

    GetModelHeaders()
    {
        return {
            "Content-Type" : "application/json",
            "Authorization" : "Bearer " + settings.Data.openaiKey
        };
    }
}

export default new OpenAI();