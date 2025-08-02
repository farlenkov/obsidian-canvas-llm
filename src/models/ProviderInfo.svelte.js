class ProviderInfo
{
    list = 
    [{
        id : "google",
        name : "Google",
        keys : "https://aistudio.google.com/app/apikey",
        models : "https://ai.google.dev/gemini-api/docs/models"
    },
    {
        id : "openai",
        name : "OpenAI",
        keys : "https://platform.openai.com/api-keys",
        models : "https://platform.openai.com/docs/pricing"
    },
    {
        id : "anthropic",
        name : "Anthropic",
        keys : "https://console.anthropic.com/account/keys",
        models : "https://docs.anthropic.com/en/docs/about-claude/models/overview"
    },
    {
        id : "deepseek",
        name : "DeepSeek",
        keys : "https://platform.deepseek.com/api_keys",
        models : "https://api-docs.deepseek.com/quick_start/pricing"
    },
    {
        id : "openrouter",
        name : "OpenRouter",
        keys : "https://openrouter.ai/settings/keys",
        models : "https://openrouter.ai/models",
        price : true
    }];

    constructor ()
    {
        this.index = {};
        this.defaultProvider = this.list[0];

        for (let i in this.list)
        {
            let provider = this.list[i];
            this.index[provider.id] = provider;
        }
    }
}

const providerInfo = new ProviderInfo();
export default providerInfo;