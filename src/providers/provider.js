export default class Provider
{
    async FetchModels()
    {
        const options = 
        {
            throw : false,
            url : this.GetFetchUrl(),
            headers : this.GetFetchHeaders()
        };
        
        console.log(`[Canvas LLM] FetchModels → ${this.name}`, options);
        const resp = await requestUrl(options);
        console.log(`[Canvas LLM] FetchModels ← ${this.name}`, resp);

        const text = await resp.text;
        const data = this.ParseResponse(text);
        this.CheckError(data);

        const result = this.ReadModels(data);
        return result;
    }

    ReadModels(data)
    {
        const result = data.data.map(model => this.ReadModel(model));
        return result;
    }

    ReadModel(model)
    {
        return { 
            id : model.id,
            name : model.display_name || model.displayName || model.id,
            desc : model.description || model.display_name || model.displayName || model.id,
            owner : model.owned_by || this.name,
            context : model.context_window || model.context_length || -1,
            prompt : -1,
            completion : -1
        };
    }

    async CallModel(model, nodes)
    {
        const messages = this.ReadMessages(nodes);

        try 
        {
            const body = this.GetModelBody(model, messages);
            
            const options = 
            {
                url : this.GetModelUrl(model),
                throw : false,
                method: 'POST',
                headers : this.GetModelHeaders(),
                body : JSON.stringify(body)
            };

            console.log(`[Canvas LLM] CallModel → ${this.name} / ${model.name}`, options);
            const resp = await requestUrl(options);
            console.log(`[Canvas LLM] CallModel ← ${this.name} / ${model.name}`, resp);
            
            const text = await resp.text;
            const data = this.ParseResponse(text);
            this.CheckError(data);
      
            const markdowns = this.ReadResponse(data);
            return markdowns;
        } 
        catch (error) 
        {
            console.error(`[Canvas LLM] CallModel ← ${this.name} / ${model.name}`, error);
            throw error;
        }
    }

    ReadMessages(nodes)
    {
        const messages = [];

        nodes.forEach(node => 
        {
            node.content.forEach(content => 
            {    
                messages.push(this.ReadMessage(node, content));
            });
        });

        return messages;
    }

    ReadMessage(node, content)
    {
        return { 
            content : content, 
            role : node.role === "model" ? "assistant" : node.role
        };
    }

    GetModelBody(model, messages)
    {
        return {
            model : model.id,
            messages : messages,
            stream : false
        };
    }

    CheckError(data)
    {
        if (typeof data?.error == "string")
            throw data.error;

        if (typeof data?.error?.message == "string")
            throw data.error.message;
    }

    ParseResponse(text)
    {
        try
        {
            const data = JSON.parse(text);
            return data;
        }
        catch(ex)
        {
            throw text;
        }
    }

    ReadResponse(data)
    {
        if (!data?.choices)
            return [""];

        const result = [];

        data.choices.forEach(choice => 
        {
            if (choice.message.reasoning)
                result.push(choice.message.reasoning);

            if (choice.message.content)
                result.push(choice.message.content);
        });

        return result;
    }
}