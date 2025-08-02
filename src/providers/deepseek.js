import settings from '$lib/overlay/Settings.svelte.js';

class DeepSeek
{
    id = "deepseek";
    name = "DeepSeek";
    keys = "https://platform.deepseek.com/api_keys";
    models = "https://api-docs.deepseek.com/quick_start/pricing";

    async FetchModels()
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

    async CallModel(model, nodes)
    {
        // https://api-docs.deepseek.com/

        const url = "https://api.deepseek.com/chat/completions";
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
                    "Authorization" : "Bearer " + settings.Data.deepseekKey
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
            console.error("[AiClient: CallDeepSeek]", error);
            throw error;
        }
    }
}

const provider = new DeepSeek();
export default provider;