import { createId } from '$lib/graph/CreateId';
import aiClient from '$lib/svelte-llm/models/AiClient.svelte.js';
import NodeState from '../Common/NodeState.svelte.js';

export default class DialogueNodeState extends NodeState
{
    VariantNum = {};
    ROLE_LABELS = [ "Role A", "Role B" ];

    constructor(id, data, appState, updateNodeInternals)
    {
        super(id, data, appState, updateNodeInternals);

        this.rootId = $derived(this.id);
        this.messages = $state(data.messages);
        this.roles = $state(data.roles);
        
        this.thinkSwitch = $state({});
        this.inProgress = $state(false);
        this.currentThread = $state(this.getThread());
        this.hasMessages = $derived(this.currentThread.length > 0);

        this.nodeTooltip = $state('');
        this.updateNodeTooltip();
    }

    updateNodeTooltip()
    {
        this.nodeTooltip = 
            `${this.roles[0].name || this.ROLE_LABELS[0]}\n(${this.roles[0].model})\n\n` + 
            `${this.roles[1].name || this.ROLE_LABELS[1]}\n(${this.roles[1].model})`;
    }

    async generate(replaceMessage)
    {
        this.inProgress = true;
        this.error = false;

        try
        {
            // SYSTEM PROMPTS

            const rolePrompts = {};
            const usedNodes = {};

            for (let edge of this.appState.graph.edges)
            {
                if (edge.target !== this.id ||
                    !edge.targetHandle)
                    continue;

                const sourceMessage = await this.appState.graph.getMessage(
                    edge.source, 
                    this.appState.app, 
                    usedNodes);
                
                rolePrompts[edge.targetHandle] = sourceMessage 
                    ? sourceMessage.content?.trim() 
                    : "";
            }

            if (!rolePrompts.role1 && 
                !rolePrompts.role2)
            {
                this.error = "System prompts for roles not defined."
                return;
            }
            else if (!rolePrompts.role1)
            {
                this.error = "System prompt for <u>Role A</u> not defined."
                return;
            }
            else if (!rolePrompts.role2)
            {
                this.error = "System prompt for <u>Role B</u> not defined."
                return;
            }

            // THREAD

            const lastParentId = replaceMessage ? replaceMessage.parentId : null;
            const tempThread = this.getThread(lastParentId);
            const roleIndex = tempThread.length % 2;
            const providerId = this.roles[roleIndex].provider;

            if (!this.appState.settings.HasKey(providerId))
            {
                this.appState.showSettings();
                this.inProgress = false;
                return;
            }

            const messages = [];
            const rolePrompt = roleIndex === 0 ? rolePrompts.role1 : rolePrompts.role2;
            messages.push({ role : "user", content : rolePrompt});

            for (var i = 0; i < tempThread.length; i++)
            {
                const role = roleIndex === 0 
                    ? (i % 2 === 0 ? "model" : "user") 
                    : (i % 2 === 0 ? "user" : "model");

                messages.push({ role : role, content : tempThread[i].text });
            }

            const modelId = this.roles[roleIndex].model;
            const { markdowns } = await aiClient.Call(providerId, modelId, messages);
            
            const newMessage = 
            {  
                id : createId(),
                text : markdowns[0],
                provider : providerId,
                model : modelId,
                role : roleIndex,
                parentId : tempThread.length == 0 ? this.rootId : tempThread[tempThread.length-1].id,
                isActive : true
            }

            if (markdowns.length > 1)
                newMessage.think = markdowns[1];

            this.addMessage(newMessage);
        }
        catch (err)
        {
            this.error = err;
        }
        finally
        {
            this.inProgress = false;
        }
    }

    addMessage(newMessage)
    {
        const messagesByParent = this.messages[newMessage.parentId];

        if (messagesByParent)
        {
            for (var i = 0; i < messagesByParent.length; i++)
                messagesByParent[i].isActive = false;

            messagesByParent.push(newMessage)
            this.messages[newMessage.parentId] = messagesByParent;
        }
        else
        {
            this.messages[newMessage.parentId] = [newMessage];
        }

        this.appState.graph.updateNode(
            this.id,
            { messages : this.messages },
            "NewMessage");

        this.currentThread = this.getThread();
        this.onMessageAdd(newMessage);
    }

    hasVariations(parentId)
    {
        const messagesByParent = this.messages[parentId || this.rootId];

        if (!messagesByParent)
            return false;
        else
            return messagesByParent.length > 1;
    }

    switchVariation(message, change)
    {
        let messagesByParent = this.messages[message.parentId];
        let currentVariation = this.VariantNum[message.id] - 1;
        let newVariation = currentVariation + change;

        if (newVariation < 0)
            newVariation = messagesByParent.length - 1;
        else if (newVariation >= messagesByParent.length)
            newVariation = 0;

        for (var i = 0; i < messagesByParent.length; i++)
            messagesByParent[i].isActive = (i == newVariation);
        
        this.appState.graph.updateNode(
            this.id,
            { messages : this.messages },
            "NewMessage");

        this.currentThread = this.getThread();
    }

    getThread(lastParentId)
    {
        let parentId = this.rootId;
        const thread = [];

        if (lastParentId === this.rootId)
            return thread;

        while (true)
        {
            const messagesByParent = this.messages[parentId];

            if (!messagesByParent)
                break;

            for (var i = 0; i < messagesByParent.length; i++)
            {
                const message = messagesByParent[i];

                if (message.isActive)
                {
                    this.VariantNum[message.id] = i + 1;
                    thread.push(message);
                    parentId = message.id;
                    break;
                }
            }

            if (parentId == lastParentId)
                break;
        }

        return thread;
    }

    getCopy(shiftKey, message)
    {
        if (message)
        {
            const result = this.thinkSwitch[message.id] 
                ? message.think 
                : message.text;
                
            return result;
        }
        else
        {
            let result = '';

            for (let i = 0; i < this.currentThread.length; i++ )
            {
                const message = this.currentThread[i];

                const roleName = 
                    this.roles[message.role].name || 
                    this.ROLE_LABELS[message.role];

                if (result)
                    result += '\n\n';

                const messageTitle = `#${i+1} ${roleName}:`;
                result += `${messageTitle}\n${'-'.repeat(messageTitle.length)}\n\n${message.text}`;
            }

            return result;   
        }
    }
}