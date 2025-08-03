import settings from '$lib/overlay/Settings.svelte.js';

class Anthropic
{
    id = "anthropic";
    name = "Anthropic";
    keys = "https://console.anthropic.com/account/keys";
    models = "https://docs.anthropic.com/en/docs/about-claude/pricing";

    async FetchModels()
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

    async CallModel(model, nodes)
    {
        // https://docs.anthropic.com/en/api/getting-started
        // https://docs.anthropic.com/en/api/messages

        const messages = [];

        nodes.forEach(node => 
        {
            node.content.forEach(content => 
            {    
                messages.push
                ({ 
                    content : content, 
                    role : node.role === "model" 
                        ? "assistant" 
                        : node.role === "system" 
                            ? "user" 
                            : node.role
                });
            });
        });

        try 
        {
            const httpReq = 
            {
                url : "https://api.anthropic.com/v1/messages",
                throw : false,
                method: 'POST',
                headers : 
                {
                    "x-api-key": settings.Data.anthropicKey,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                    "anthropic-dangerous-direct-browser-access" : "true"
                },
                body : JSON.stringify
                ({
                    model : model.id,
                    messages : messages,
                    max_tokens : 2048
                })
            };

            console.log(`[Canvas LLM] REQUEST: ${this.name} / ${model.name}`, httpReq);
            const httpResp = await requestUrl(httpReq);
            console.log(`[Canvas LLM] RESPONSE: ${this.name} / ${model.name}`, httpResp);
            const jsonResp = await httpResp.json;
            
            if (jsonResp?.error?.message)
                throw jsonResp.error.message;

            const markdowns = jsonResp.content.map(content => content.text);
            return markdowns;
        } 
        catch (error) 
        {
            console.error("[AiClient: CallAnthropic]", error);
            throw error;
        }
    }
}

const provider = new Anthropic();
export default provider;