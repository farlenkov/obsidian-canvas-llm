import settings from '$lib/overlay/Settings.svelte.js';

class SambaNova
{
    id = "sambanova";
    name = "SambaNova";
    keys = "https://cloud.sambanova.ai/apis";
    models = "https://cloud.sambanova.ai/plans/pricing";
    price = true;

    async FetchModels()
    {
        // https://docs.sambanova.ai/cloud/api-reference/endpoints/model-list

        const url = "https://api.sambanova.ai/v1/models";
        const resp = await request(url);
        const data = JSON.parse(resp);
        const result = [];

        data.data.forEach(model => 
        {    
            result.push(
            { 
                id : model.id,
                name : model.id,
                desc : model.id,
                context : model.context_length,
                prompt : parseFloat(model.pricing.prompt),
                completion : parseFloat(model.pricing.completion)
            })
        });

        return result;
    }

    async CallModel(model, nodes)
    {
        // https://docs.sambanova.ai/cloud/api-reference/endpoints/chat

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
                url : "https://api.sambanova.ai/v1/chat/completions",
                throw : false,
                method: 'POST',
                headers : 
                {
                    "Content-Type" : "application/json",
                    "Authorization" : "Bearer " + settings.Data.sambanovaKey
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
      
            const message = jsonResp.choices[0].message;
            const markdowns = [message.content];
            return markdowns;
        } 
        catch (error) 
        {
            console.error("[AiClient: CallSambaNova]", error);
            throw error;
        }
    }
}

const provider = new SambaNova();
export default provider;