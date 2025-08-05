import anthropic    from '$lib/providers/anthropic.js';
import deepseek     from '$lib/providers/deepseek.js';
import google       from '$lib/providers/google.js';
import groq         from '$lib/providers/groq.js';
import openai       from '$lib/providers/openai.js';
import openrouter   from '$lib/providers/openrouter.js';
import sambanova    from '$lib/providers/sambanova.js';
import xai          from '$lib/providers/xai.js';

class ProviderInfo
{
    List = 
    [
        anthropic,
        deepseek,
        google,
        groq,
        openai,
        openrouter,
        sambanova,
        xai
    ];

    constructor ()
    {
        this.ById = {};
        this.List.forEach(provider => this.ById[provider.id] = provider);
    }
}

const providerInfo = new ProviderInfo();
export default providerInfo;