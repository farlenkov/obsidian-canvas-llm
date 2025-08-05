import settings from '$lib/overlay/Settings.svelte.js';
import Provider from './provider.js';

class Groq extends Provider
{
    id = "groq";
    name = "Groq";
    keys = "https://console.groq.com/keys";
    models = "";

    // https://console.groq.com/docs/api-reference#models-list

    GetFetchUrl()
    {
        return "https://api.groq.com/openai/v1/models";
    }

    GetFetchHeaders()
    {
        return {
            "Content-Type" : "application/json",
            "Authorization" : `Bearer ${settings.Data.groqKey}`
        };
    }

    // https://console.groq.com/docs/api-reference#chat-create

    GetModelUrl(model)
    {
        return "https://api.groq.com/openai/v1/chat/completions";
    }

    GetModelHeaders()
    {
        return {
            "Content-Type" : "application/json",
            "Authorization" : "Bearer " + settings.Data.groqKey
        };
    }
}

export default new Groq();