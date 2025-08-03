import settings from '$lib/overlay/Settings.svelte.js';

class Google
{
    id = "google";
    name = "Google";
    keys = "https://aistudio.google.com/app/apikey";
    models = "https://ai.google.dev/gemini-api/docs/pricing";

    async FetchModels()
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

    async CallModel(model, nodes)
    {
        const messages = [];

        nodes.forEach(node => 
        {
            let message = 
            { 
                parts : [],
                role :  node.role == "system" ? "user" : node.role
            };

            node.content.forEach(content =>
            {
                message.parts.push
                ({
                    text : node.role == "system" ? `*${content}*` : content
                }); 
            });

            messages.push(message);
        });

        try 
        {
            const body = 
            {
                contents : messages,
                generationConfig : {},  
                safetySettings : [{ category : "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold : "BLOCK_NONE" }]
            };

            if (model.thinking)
                body.generationConfig.thinkingConfig = { includeThoughts : true };
            
            const httpReq = 
            {
                url : `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent`,
                // throw : true,
                method: 'POST',
                body : JSON.stringify(body),
                headers : 
                {
                    "Content-Type" : "application/json",
                    "x-goog-api-key" : settings.Data.googleKey
                }
            };

            console.log(`[Canvas LLM] REQUEST: ${this.name} / ${model.name}`, httpReq);
            const httpResp = await requestUrl(httpReq);
            console.log(`[Canvas LLM] RESPONSE: ${this.name} / ${model.name}`, httpResp);
            const jsonResp = await httpResp.json;

            if (jsonResp?.error?.message)
                throw jsonResp.error.message;

            if (!jsonResp.candidates)
                throw "API provider respond with empty message.";

            const markdowns = jsonResp.candidates[0].content.parts.map(part => part.text);
            return markdowns;
        } 
        catch (error) 
        {
            console.error("[AiClient: CallGoogle]", error);
            throw error;
        }
    }
}

const provider = new Google();
export default provider;