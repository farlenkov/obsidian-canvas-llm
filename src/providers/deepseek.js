import settings from '$lib/settings/Settings.svelte.js';
import Provider from './provider.js';

class DeepSeek extends Provider
{
    id = "deepseek";
    name = "DeepSeek";
    keys = "https://platform.deepseek.com/api_keys";
    models = "https://api-docs.deepseek.com/quick_start/pricing";

    // https://api-docs.deepseek.com/api/list-models

    GetFetchUrl()
    {
        return "https://api.deepseek.com/models";
    }

    GetFetchHeaders()
    {
        return {
            "Authorization" : `Bearer ${settings.Data.deepseekKey}`,
            "Accept" : "application/json"
        };
    }

    // https://api-docs.deepseek.com/

    GetModelUrl(model)
    {
        return "https://api.deepseek.com/chat/completions";
    }

    GetModelHeaders()
    {
        return {
            "Content-Type" : "application/json",
            "Authorization" : "Bearer " + settings.Data.deepseekKey
        };
    }
}

export default new DeepSeek();