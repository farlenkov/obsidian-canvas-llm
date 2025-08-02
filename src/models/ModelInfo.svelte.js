import providerInfo from "./ProviderInfo.svelte.js"
import settings from '$lib/overlay/Settings.svelte.js';

class ModelInfo
{
    index = $state({});
    updating = $state({});
    errors = $state({});

    constructor ()
    {
        this.#readLocal ();
    }

    async #readLocal ()
    {
        while (!settings.Data)
            await new Promise((resolve) => setTimeout(resolve, 1));

        var self = this;
        this.defaultProvider = providerInfo.list[0];

        providerInfo.list.forEach(provider => 
        {
            let models = settings.GetModels(provider.id);

            models.forEach(model =>
            {
                model.providerId = provider.id;
                self.index[model.id] = model;
            });
        });
    }

    async updateModels(providerId)
    {
        console.log("updateModels", providerId);

        if (this.updating[providerId])
            return;

        this.updating[providerId] = true;

        try
        {
            let models = [];

            switch (providerId)
            {
                case "google":      models = await this.fetchGoogle();      break;
                case "openai":      models = await this.fetchOpenAI();      break;
                case "anthropic":   models = await this.fetchAnthropic();   break;
                case "deepseek":    models = await this.fetchDeepSeek();    break;
                case "openrouter":  models = await this.fetchOpenRouter();  break;
            }

            models.sort((a,b) => 
            {
                if (a.id < b.id)
                    return -1;  
                else if (a.id > b.id)
                    return 1;    
                else
                    return 0;
            });

            settings.SetModels(providerId, models);
            settings.Save();

            this.#readLocal ();
        }
        catch (ex)
        {
            console.log(ex);
            this.errors[providerId] = ex;
        }

        this.updating[providerId] = false;
    }

    async fetchGoogle()
    {
        // https://ai.google.dev/api/models#models_list-SHELL

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${settings.Data.googleKey}`;
        const resp = await request(url);
        const data = JSON.parse(resp);
        const result = [];

        data.models.forEach(model => 
        {
            const id = model.name.replace("models/", "");

            if (model.supportedGenerationMethods.indexOf('generateContent') < 0)
                return;

            result.push(
            { 
                id : id,
                name : model.displayName,
                desc : model.description,
                context : model.inputTokenLimit,
                prompt : -1,
                completion : -1
            })
        });

        return result;
    }

    async fetchOpenAI()
    {
        // https://platform.openai.com/docs/api-reference/models/list

        const options = 
        {
            url : `https://api.openai.com/v1/models`,
            headers : { "Authorization" : `Bearer ${settings.Data.openaiKey}` }
        };
        
        const resp = await request(options);
        const data = JSON.parse(resp);
        const result = [];

        data.data.forEach(model => 
        {
            result.push(
            { 
                id : model.id,
                name : model.id,
                desc : model.id,
                context : -1,
                prompt : -1,
                completion : -1
            })
        });

        return result;
    }

    async fetchAnthropic()
    {
        // https://docs.anthropic.com/en/api/models-list

        const options = 
        {
            url : `https://api.anthropic.com/v1/models?limit=1000`,
            headers : 
            { 
                "x-api-key" : settings.Data.anthropicKey,
                "anthropic-version" : "2023-06-01"
            }
        };
        
        const resp = await request(options);
        const data = JSON.parse(resp);
        const result = [];

        data.data.forEach(model => 
        {
            result.push(
            { 
                id : model.id,
                name : model.display_name,
                desc : model.display_name,
                context : -1,
                prompt : -1,
                completion : -1
            })
        });

        return result;
    }

    async fetchDeepSeek()
    {
        // https://api-docs.deepseek.com/api/list-models

        const options = 
        {
            url : `https://api.deepseek.com/models`,
            headers : 
            { 
                "Authorization" : `Bearer ${settings.Data.deepseekKey}`,
                "Accept" : "application/json"
            }
        };
        
        const resp = await request(options);
        const data = JSON.parse(resp);
        const result = [];

        data.data.forEach(model => 
        {
            result.push(
            { 
                id : model.id,
                name : model.id,
                desc : model.id,
                context : -1,
                prompt : -1,
                completion : -1
            })
        });

        return result;
    }

    async fetchOpenRouter()
    {
        const url = "https://openrouter.ai/api/v1/models";
        const resp = await fetch(url);

        if (!resp.ok)
            throw new Error(`${resp.status}: ${resp.statusText}`);

        const data = await resp.json();
        const result = [];

        data.data.forEach(model => 
        {    
            result.push(
            { 
                id : model.id,
                name : model.name,
                desc : model.description,
                context : model.context_length,
                prompt : parseFloat(model.pricing.prompt),
                completion : parseFloat(model.pricing.completion)
            })
        });

        return result;
    }
}

const modelInfo = new ModelInfo();
export default modelInfo;