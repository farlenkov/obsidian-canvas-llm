import modelsInfo from '$lib/models/ModelInfo.svelte.js';
import settings from '$lib/overlay/Settings.svelte.js';

const LINE = "\n\n---\n\n";

class AiClient
{
    async Call(modelId, messages)
    {
        const model = modelsInfo.index[modelId];
        let markdowns;

        switch (model.providerId)
        {
            case "openai"     : markdowns = await this.CallOpenAI(model, messages); break;
            case "google"     : markdowns = await this.CallGoogle(model, messages); break;
            case "anthropic"  : markdowns = await this.CallAnthropic(model, messages); break;
            case "deepseek"   : markdowns = await this.CallDeepSeek(model, messages); break;
            case "openrouter" : markdowns = await this.CallOpenRouter(model, messages); break;
            default : throw `[AiClient: Call] Invalid LLM: ${model.providerId} / ${model.id}`;
        }

        const htmls = null;
        return { markdowns, htmls };
    }

    async CallOpenAI(model, nodes)
    {
        // https://platform.openai.com/docs/guides/text-generation#conversations-and-context
        // https://platform.openai.com/docs/quickstart?language-preference=curl

        const url = "https://api.openai.com/v1/chat/completions";
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
                    "Authorization" : "Bearer " + settings.Data.openaiKey
                },
                body : JSON.stringify
                ({
                    model : model.id,
                    messages : messages
                })
            });

            const jsonResp = await httpResp.json();

            if (jsonResp?.error?.message)
                throw jsonResp.error.message;

            if (!httpResp.ok)
                throw `${httpResp.status}: ${httpResp.statusText}`;
      
            const markdowns = jsonResp.choices.map(choice => choice.message.content);
            return markdowns;
        } 
        catch (error) 
        {
            console.error("[AiClient: CallOpenAI]", error);
            throw error;
        }
    }

    async CallGoogle(model, nodes)
    {
        const url    = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent`;
        // const url = `https://generativelanguage.googleapis.com/v1alpha/models/${model.id}:generateContent`;
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
            
            const options = 
            {
                url : url,
                throw : true,
                method: 'POST',
                body : JSON.stringify(body),
                headers : 
                {
                    "Content-Type" : "application/json",
                    "x-goog-api-key" : settings.Data.googleKey
                }
            };

            const httpResp = await requestUrl(options);
            const jsonResp = await httpResp.json;
            const markdowns = jsonResp.candidates[0].content.parts.map(part => part.text);
            return markdowns;
        } 
        catch (error) 
        {
            console.error("[AiClient: CallGoogle]", error);
            throw error;
        }
    }
    
    async CallAnthropic(model, nodes)
    {
        // https://docs.anthropic.com/en/api/getting-started
        // https://docs.anthropic.com/en/api/messages

        const url = `https://api.anthropic.com/v1/messages`;
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
            const httpResp = await fetch(url, 
            {
                method: "POST",
                headers: 
                {
                    "x-api-key": settings.Data.anthropicKey,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                    "anthropic-dangerous-direct-browser-access" : "true"
                },
                body: JSON.stringify(
                {
                    model : model.id,
                    messages : messages,
                    max_tokens : 2048
                })
            });

            const jsonResp = await httpResp.json();
            
            if (jsonResp?.error?.message)
                throw jsonResp.error.message;

            if (!httpResp.ok)
                throw `${httpResp.status}: ${httpResp.statusText}`;
            
            const markdowns = jsonResp.content.map(content => content.text);
            return markdowns;
        } 
        catch (error) 
        {
            console.error("[AiClient: CallAnthropic]", error);
            throw error;
        }
    }

    async CallDeepSeek(model, nodes)
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

    async CallOpenRouter(model, nodes)
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

const aiClient = new AiClient();
export default aiClient;