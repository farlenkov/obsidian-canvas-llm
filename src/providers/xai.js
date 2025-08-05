import settings from '$lib/overlay/Settings.svelte.js';

class OpenAI
{
    id = "xai";
    name = "xAI";
    keys = "https://console.x.ai/team/default/api-keys";
    models = "https://docs.x.ai/docs/models";

    async FetchModels()
    {
        // https://docs.x.ai/docs/api-reference#list-models

        const options = 
        {
            url : `https://api.x.ai/v1/models`,
            headers : { "Authorization" : `Bearer ${settings.Data.xaiKey}` },
            throw : false
        };
        
        console.log(`[Canvas LLM] REQUEST: ${this.name}`, options);
        const resp = await requestUrl(options);
        console.log(`[Canvas LLM] RESPONSE: ${this.name}`, resp);

        const data = resp.json;
        const result = [];

        data.data.forEach(model => 
        {
            result.push(
            { 
                id : model.id,
                name : model.id,
                desc : model.id,
                owner : model.owned_by,
                context : -1,
                prompt : -1,
                completion : -1
            })
        });

        return result;
    }

    async CallModel(model, nodes)
    {
        // https://docs.x.ai/docs/guides/chat

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
            const httpReq = 
            {
                url : "https://api.x.ai/v1/chat/completions",
                throw : false,
                method: 'POST',
                headers : 
                {
                    "Content-Type" : "application/json",
                    "Authorization" : "Bearer " + settings.Data.openaiKey
                },
                body : JSON.stringify
                ({
                    model : model.id,
                    messages : messages,
                    stream : false
                })
            };

            console.log(`[Canvas LLM] REQUEST: ${this.name} / ${model.name}`, httpReq);
            const httpResp = await requestUrl(httpReq);
            console.log(`[Canvas LLM] RESPONSE: ${this.name} / ${model.name}`, httpResp);
            const jsonResp = await httpResp.json;
            
            if (jsonResp?.error?.message)
                throw jsonResp.error.message;
      
            const markdowns = jsonResp.choices.map(choice => choice.message.content);
            return markdowns;
        } 
        catch (error) 
        {
            console.error("[AiClient: CallxAI]", error);
            throw error;
        }
    }
}

const provider = new OpenAI();
export default provider;