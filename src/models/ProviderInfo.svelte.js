import google       from '$lib/providers/google.js';
import openai       from '$lib/providers/openai.js';
import anthropic    from '$lib/providers/anthropic.js';
import deepseek     from '$lib/providers/deepseek.js';
import openrouter   from '$lib/providers/openrouter.js';

class ProviderInfo
{
    list = 
    [
        google,
        openai,
        anthropic,
        deepseek,
        openrouter
    ];

    constructor ()
    {
        this.index = {};
        this.defaultProvider = this.list[0];
        this.list.forEach(provider => this.index[provider.id] = provider);
    }
}

const providerInfo = new ProviderInfo();
export default providerInfo;