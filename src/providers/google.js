import settings from '$lib/overlay/Settings.svelte.js';
import Provider from './provider.js';

class Google extends Provider
{
    id = "google";
    name = "Google";
    keys = "https://aistudio.google.com/app/apikey";
    models = "https://ai.google.dev/gemini-api/docs/pricing";

    // https://ai.google.dev/api/models#models_list-SHELL

    GetFetchUrl()
    {
        return `https://generativelanguage.googleapis.com/v1beta/models?key=${settings.Data.googleKey}`;
    }

    GetFetchHeaders()
    {
        return {};
    }

    ReadModels(data)
    {
        const result = [];

        data.models.forEach(model => 
        {
            if (model.supportedGenerationMethods.indexOf('generateContent') < 0)
                return;

            result.push(
            { 
                id : model.name.replace("models/", ""),
                name : model.displayName,
                desc : model.description,
                owner : this.name,
                context : model.inputTokenLimit,
                prompt : -1,
                completion : -1
            })
        });

        return result;
    }

    GetModelUrl(model)
    {
        return `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent`;
    }

    GetModelHeaders()
    {
        return {
            "Content-Type" : "application/json",
            "x-goog-api-key" : settings.Data.googleKey
        };
    }

    ReadMessages(nodes)
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

        return messages;
    }

    GetModelBody(model, messages)
    {
        const body = 
        {
            contents : messages,
            generationConfig : {},  
            safetySettings : 
            [{ 
                category : "HARM_CATEGORY_SEXUALLY_EXPLICIT", 
                threshold : "BLOCK_NONE" 
            }]
        };

        // if (model.thinking)
        //     body.generationConfig.thinkingConfig = { includeThoughts : true };

        return body;
    }

    ReadResponse(data)
    {            
        if (!data?.candidates?.[0]?.content?.parts)
            return [""];

        return data.candidates[0].content.parts.map(part => part.text);
    }
}

export default new Google();