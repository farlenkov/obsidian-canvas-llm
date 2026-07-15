import { createId } from '$lib/graph/CreateId';
import { extractTag } from '$lib/svelte-obsidian/src/String.js';
import { EventEmitter } from '$lib/svelte-obsidian/src/Event.js';
import aiClient from '$lib/svelte-llm/models/AiClient.svelte.js';
import NodeState from '../Common/NodeState.svelte.js';

export default class DialogueNodeState extends NodeState
{
    variantNum = {};
    parentIds = {};
    onStartEdit = new EventEmitter();
    nodeBody = null;

    static ROLE_LABELS = [ "Role A", "Role B" ];

    constructor(id, data, appState, updateNodeInternals)
    {
        super(id, data, appState, updateNodeInternals);

        this.rootId = $derived(this.id);
        this.messages = $state(data.messages);
        this.roles = $state(data.roles);

        this.editId = $state(data.editId    || null);
        this.editText = $state(data.edit    || null);
        this.inputText = $state(data.input  || null);
        
        this.thinkSwitch = $state({});
        this.inProgress = $state(false);
        this.currentThread = $state(this.getCurrentThread());
        this.hasMessages = $derived(this.currentThread.length > 0);

        this.nodeTooltip = $state('');
        this.nodeHandles = $state([]);
        this.updateNodeTooltip();
        this.updateHandles();
    }

    upgradeNode(id, data)
    {
        // add BOT 

        for (const role of data.roles)
            if (role.bot === undefined)
                role.bot = true;

        // remove parantId

        for (const parentId in data.messages)
            for (const mesage of data.messages[parentId])
                if (mesage.parentId)
                    delete mesage.parentId;
    }

    updateNodeTooltip()
    {
        this.nodeTooltip = 
            `${this.roles[0].name || DialogueNodeState.ROLE_LABELS[0]}\n(${this.roles[0].model})\n\n` + 
            `${this.roles[1].name || DialogueNodeState.ROLE_LABELS[1]}\n(${this.roles[1].model})`;
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
            const edges = this.getInputEdges();

            for (let targetHandle in edges)
            {
                const sourceMessage = await this.appState.graph.getMessage(
                    edges[targetHandle].source, 
                    this.appState.app, 
                    usedNodes);
                
                rolePrompts[targetHandle] = sourceMessage 
                    ? sourceMessage.content?.trim() 
                    : "";
            }

            // if (!rolePrompts.role1 && 
            //     !rolePrompts.role2)
            // {
            //     this.error = "System prompts for roles not defined."
            //     return;
            // }
            // else if (!rolePrompts.role1)
            // {
            //     this.error = "System prompt for <u>Role A</u> not defined."
            //     return;
            // }
            // else if (!rolePrompts.role2)
            // {
            //     this.error = "System prompt for <u>Role B</u> not defined."
            //     return;
            // }

            // THREAD

            const lastParentId = replaceMessage ? this.parentIds[replaceMessage.id] : null;
            const tempThread = this.getCurrentThread(lastParentId);
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
            const roleMemory = this.roles[roleIndex].memory;

            if (rolePrompt)
                messages.push({ role : "user", content : rolePrompt});

            for (var i = 0; i < tempThread.length; i++)
            {
                const message = tempThread[i];
                const isMyMessage = roleIndex === message.role;
                const role = isMyMessage ? "model" : "user";

                const content = !message.private
                    ? message.text
                    : isMyMessage
                        ? message.text
                        : message.public;

                messages.push({ role : role, content : content });
            }

            if (roleMemory)
            {
                messages.push
                ({ 
                    role : "user", 

                    content : 
                        `### Response format\n` + 
                        `Always respond in this format, without any external explanations:\n` +
                        `<memory>\nYour secret thoughts and info that you want to hide from your interlocutor. Only you will see this in next turns.\n</memory>\n` +
                        `<message>\nYour answer addressed to your interlocutor. DO NOT describe any internal thoughts here. You can use markdown format.\n</message>`
                });
            }

            if (messages.length === 0)
                messages.push({ role : "user", content : ""});

            const modelId = this.roles[roleIndex].model;
            const { markdowns } = await aiClient.Call(providerId, modelId, messages);

            const newMessage = 
            {  
                id : createId(),
                text : markdowns[0],
                provider : providerId,
                model : modelId,
                role : roleIndex,
                isActive : true                
            }

            if (markdowns.length > 1)
                newMessage.think = markdowns[1];

            if (roleMemory)
                this.parseMemory(newMessage);

            const parentId = tempThread.length == 0 
                ? this.rootId 
                : tempThread[tempThread.length-1].id;

            this.addMessage(newMessage, parentId);
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

    parseMemory(newMessage)
    {
        const system = extractTag(newMessage.text, "system");
        const memory = extractTag(newMessage.text, "memory");
        const message = extractTag(newMessage.text, "message");

        if (memory && message)
        {
            newMessage.private = memory;
            newMessage.public = message;
        }
        else
        {
            delete newMessage.private;
            delete newMessage.public;
        }

        if (system)
            newMessage.system = system;
        else
            delete newMessage.system;
    }

    addMessage(newMessage, parentId)
    {
        const messagesByParent = this.messages[parentId];

        if (messagesByParent)
        {
            for (var i = 0; i < messagesByParent.length; i++)
                messagesByParent[i].isActive = false;

            messagesByParent.push(newMessage)
            this.messages[parentId] = messagesByParent;
        }
        else
        {
            this.messages[parentId] = [newMessage];
        }

        this.appState.graph.updateNode(
            this.id,
            { messages : this.messages },
            "newDialogueMessage");

        this.currentThread = this.getCurrentThread();
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
        let parentId = this.parentIds[message.id];
        let messagesByParent = this.messages[parentId];
        let currentVariation = this.variantNum[message.id] - 1;
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
            "switchDialogueMessage");

        this.currentThread = this.getCurrentThread();
    }

    startEdit(message)
    {
        this.editId   = message.id;
        this.editText = message.text;
        this.saveEdit();

        this.currentThread = this.getCurrentThread();
        this.onStartEdit.emit();
    }

    saveEdit()
    {        
        this.appState.graph.updateNode(
            this.id,
            { 
                editId : this.editId,
                edit   : this.editText,
            },
            "editDialogueMessage");
    }

    saveInput()
    {        
        this.appState.graph.updateNode(
            this.id,
            { input : this.inputText },
            "editDialogueMessage");
    }

    resetEdit()
    {
        this.editId = null;
        this.editText = null;
        this.saveEdit();
        this.currentThread = this.getCurrentThread();
    }

    resetInput()
    {
        this.inputText = null;
        this.saveInput();
    }

    submitEdit()
    {
        const oldMessage = this.getMessageById(this.editId);
        const oldRole = this.roles[oldMessage.role];

        if (!oldMessage)
        {
            this.resetEdit();
            return;
        }

        if (oldMessage.text === this.editText)
        {
            this.resetEdit();
            return;
        }

        if (!oldMessage.model &&
            !this.messages[oldMessage.id]?.length)
        {
            oldMessage.text = this.editText;

            if (oldRole.memory)
                this.parseMemory(oldMessage);

            this.resetEdit();
            return;
        }

        const newMessage = 
        {  
            id : createId(),
            text : this.editText,
            isActive : true,
            role : oldMessage.role
        }

        if (oldRole.memory)
            this.parseMemory(newMessage);

        const parentId = this.parentIds[oldMessage.id];
        this.addMessage(newMessage, parentId);
        this.resetEdit();
        this.tryAutoReply();
    }

    submitInput()
    {
        const thread = this.currentThread;

        const newMessage = 
        {  
            id : createId(),
            text : this.inputText,
            role : thread.length % 2,
            isActive : true
        }

        const parentId = thread.length == 0 
            ? this.rootId 
            : thread[thread.length-1].id;
            
        this.addMessage(newMessage, parentId);
        this.resetInput();
        this.tryAutoReply();
    }

    tryAutoReply()
    {
        const thread = this.currentThread;
        const prevRole = this.roles[(thread.length - 1) % 2];
        const nextRole = this.roles[ thread.length      % 2];

        if (!prevRole.bot && 
            nextRole.bot && 
            nextRole.auto)
        {
            this.generate();
        }
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
                    DialogueNodeState.ROLE_LABELS[message.role];

                if (result)
                    result += '\n\n';

                const messageTitle = `#${i+1} ${roleName}:`;
                result += `${messageTitle}\n${'-'.repeat(messageTitle.length)}\n\n${message.text}`;
            }

            return result;   
        }
    }

    getInputEdges()
    {
        const edges = {};

        for (let edge of this.appState.graph.edges)
        {
            if (edge.target !== this.id ||
                !edge.targetHandle)
                continue;

            edges[edge.targetHandle] = edge;
        }

        return edges;
    }

    updateHandles()
    {
        // const result = [];
        // const usedIns = this.getUsedIns();

        // if (this.roles[0].bot || usedIns.includes("role1"))
        //     result.push({ "role1" : (this.roles[0].name || DialogueNodeState.ROLE_LABELS[0]) + " (system prompt)" });

        // if (this.roles[1].bot || usedIns.includes("role2"))
        //     result.push({ "role2" : (this.roles[1].name || DialogueNodeState.ROLE_LABELS[1]) + " (system prompt)" });

        // this.nodeHandles = result;

        const result = [];

        for(let i = 0; i < 2; i++)
        {
            let label = (this.roles[i].name || DialogueNodeState.ROLE_LABELS[i]) + " (system prompt)";

            if (!this.roles[i].bot)
                label += "\n\nWARNING:\nYou need to enable LLM\nin node settings";

            const handle = {};
            handle['role' + (i + 1)] = label;
            result.push(handle);
        }

        this.nodeHandles = result;
            // [{ "role1" : (this.roles[0].name || DialogueNodeState.ROLE_LABELS[0]) + "\n(system prompt)" },
            // { "role2" : (this.roles[1].name || DialogueNodeState.ROLE_LABELS[1]) + "\n(system prompt)" }];

        this.updateNodeInternals();
    }

    getRoleName(roleNum)
    {
        const role = this.roles[roleNum];
        const roleName = role.name || DialogueNodeState.ROLE_LABELS[roleNum];
        return roleName;
    }

    getMessageById(messageId)
    {
        if (!messageId)
            return;

        for (const parentId in this.messages)
        {
            for (const message of this.messages[parentId])
            {
                if (message.id === messageId)
                {
                    this.parentIds[message.id] = parentId;
                    return message;
                }
            }
        }
    }

    getCurrentThread(lastParentId)
    {
        return DialogueNodeState.getThread
        (
            this.rootId,
            this.messages,
            this.parentIds,
            this.variantNum,
            lastParentId || this.editId
        );
    }

    static getThread(
        rootId, 
        messages, 
        parentIds = {}, 
        variantNum = {}, 
        lastParentId = undefined)
    {
        let parentId = rootId;
        const thread = [];

        if (lastParentId === rootId)
            return thread;

        while (true)
        {
            const messagesByParent = messages[parentId];

            if (!messagesByParent)
                break;

            for (var i = 0; i < messagesByParent.length; i++)
            {
                const message = messagesByParent[i];
                parentIds[message.id] = parentId;

                if (message.isActive)
                {
                    variantNum[message.id] = i + 1;
                    parentId = message.id;
                    thread.push(message);
                    break;
                }
            }

            if (parentId == lastParentId)
                break;
        }

        return thread;
    }
}