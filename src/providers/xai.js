import settings from '$lib/settings/Settings.svelte.js';
import Provider from './provider.js';

class xAI extends Provider
{
    id = "xai";
    name = "xAI";
    keys = "https://console.x.ai/team/default/api-keys";
    models = "https://docs.x.ai/docs/models";
    
    // https://docs.x.ai/docs/api-reference#list-models

    GetFetchUrl()
    {
        return "https://api.x.ai/v1/models";
    }

    GetFetchHeaders()
    {
        return { "Authorization" : `Bearer ${settings.Data.xaiKey}` };
    }

    // https://docs.x.ai/docs/guides/chat

    GetModelUrl(model)
    {
        return "https://api.x.ai/v1/chat/completions";
    }

    GetModelHeaders()
    {
        return {
            "Content-Type" : "application/json",
            "Authorization" : `Bearer ${settings.Data.xaiKey}`
        };
    }
}

export default new xAI();