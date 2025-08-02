import settings from '$lib/overlay/Settings.svelte.js';

class OpenRouter
{
    id = "openrouter";
    name = "OpenRouter";
    keys = "https://openrouter.ai/settings/keys";
    models = "https://openrouter.ai/models";
    price = true;

    async FetchModels()
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

    async CallModel(model, nodes)
    {
        // https://openrouter.ai/docs/quick-start

        const url = "https://openrouter.ai/api/v1/chat/completions";
        const messages = [];

        nodes.forEach(node => 
        {
            node.content.forEach(content => 
            {    
                messages.push
                ({ 
                    content : content, 
                    role : node.role === "model" ? "assistant" : node.role
                });
            });
        });

        try 
        {
            const httpResp = await fetch(url, 
            {
                method : "POST",
                headers : 
                {
                    "Content-Type" : "application/json",
                    "Authorization" : "Bearer " + settings.Data.openrouterKey
                },
                body : JSON.stringify
                ({
                    model : model.id,
                    messages : messages,
                    stream : false
                })
            });

            const jsonResp = await httpResp.json();

            if (jsonResp?.error?.message)
                throw jsonResp.error.message;

            if (!httpResp.ok)
                throw `${httpResp.status}: ${httpResp.statusText}`;
      
            const message = jsonResp.choices[0].message;

            const markdowns = message.reasoning_content 
                ? [message.reasoning_content, message.content]
                : [message.content];

            return markdowns;
        } 
        catch (error) 
        {
            console.error("[AiClient: CallOpenRouter]", error);
            throw error;
        }
    }
}

const provider = new OpenRouter();
export default provider;