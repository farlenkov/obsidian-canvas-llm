import settings from '$lib/overlay/Settings.svelte.js';
import Provider from './provider.js';

class Anthropic extends Provider
{
    id = "anthropic";
    name = "Anthropic";
    keys = "https://console.anthropic.com/account/keys";
    models = "https://docs.anthropic.com/en/docs/about-claude/pricing";

    // https://docs.anthropic.com/en/api/models-list

    GetFetchUrl()
    {
        return "https://api.anthropic.com/v1/models?limit=1000";
    }

    GetFetchHeaders()
    {
        return {
            "content-type" : "application/json",
            "x-api-key" : settings.Data.anthropicKey,
            "anthropic-version" : "2023-06-01"
        };
    }

    // https://docs.anthropic.com/en/api/getting-started
    // https://docs.anthropic.com/en/api/messages

    GetModelUrl(model)
    {
        return "https://api.anthropic.com/v1/messages";
    }

    GetModelHeaders()
    {
        return {
            "x-api-key" : settings.Data.anthropicKey,
            "anthropic-version" : "2023-06-01",
            "content-type" : "application/json",
            "anthropic-dangerous-direct-browser-access" : "true"
        };
    }

    GetModelBody(model, messages)
    {
        return {
            model : model.id,
            messages : messages,
            max_tokens : 2048
        };
    }

    ReadResponse(data)
    {
        return data.content.map(content => content.text);
    }
}

export default new Anthropic();