import settings from '$lib/overlay/Settings.svelte.js';

class Groq
{
    id = "groq";
    name = "Groq";
    keys = "https://console.groq.com/keys";
    models = "";

    async FetchModels()
    {
        // https://console.groq.com/docs/api-reference#models-list

        const options = 
        {
            url : `https://api.groq.com/openai/v1/models `,
            headers : { "Authorization" : `Bearer ${settings.Data.groqKey}` }
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
                context : model.context_window,
                prompt : -1,
                completion : -1
            })
        });

        return result;
    }

    async CallModel(model, nodes)
    {
        // https://console.groq.com/docs/api-reference#chat-create

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
                url : "https://api.groq.com/openai/v1/chat/completions",
                throw : false,
                method: 'POST',
                headers : 
                {
                    "Content-Type" : "application/json",
                    "Authorization" : "Bearer " + settings.Data.groqKey
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
            console.error("[AiClient: CallGroq]", error);
            throw error;
        }
    }
}

const provider = new Groq();
export default provider;