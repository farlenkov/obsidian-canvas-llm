import settings from '$lib/overlay/Settings.svelte.js';

class OpenAI
{
    id = "openai";
    name = "OpenAI";
    keys = "https://platform.openai.com/api-keys";
    models = "https://platform.openai.com/docs/pricing";

    async FetchModels()
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

    async CallModel(model, nodes)
    {
        // https://platform.openai.com/docs/guides/text-generation#conversations-and-context
        // https://platform.openai.com/docs/quickstart?language-preference=curl

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
                url : "https://api.openai.com/v1/chat/completions",
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
                    messages : messages
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
            console.error("[AiClient: CallOpenAI]", error);
            throw error;
        }
    }
}

const provider = new OpenAI();
export default provider;