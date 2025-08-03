import google       from '$lib/providers/google.js';
import openai       from '$lib/providers/openai.js';
import anthropic    from '$lib/providers/anthropic.js';
import deepseek     from '$lib/providers/deepseek.js';
import openrouter   from '$lib/providers/openrouter.js';
import sambanova    from '$lib/providers/sambanova.js';

class ProviderInfo
{
    List = 
    [
        anthropic,
        deepseek,
        google,
        openai,
        openrouter,
        sambanova
    ];

    constructor ()
    {
        this.ById = {};
        this.List.forEach(provider => this.ById[provider.id] = provider);
    }
}

const providerInfo = new ProviderInfo();
export default providerInfo;