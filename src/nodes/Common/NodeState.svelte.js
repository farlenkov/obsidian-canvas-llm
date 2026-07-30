import { PlaceholderSet } from '$lib/svelte-obsidian/src/Placeholder.js';
import { EventEmitter } from '$lib/svelte-obsidian/src/Event.js';

export default class NodeState
{
    constructor(id, graph)
    {
        this.id = id;
        this.app = graph.app;
        this.graph = graph;

        this.updateNodeInternals = new EventEmitter();
        this.placeholders = new PlaceholderSet();
        
        this.isTemplate = $state();
        this.allIns = $state([]);
        this.error = $state(false);
    }

    init (data)
    {
        this.upgradeNode(data);
        this.isTemplate = data.template ?? false;
    }

    destroy()
    {
        
    }

    upgradeNode(data)
    {

    }

    async getCopy(shiftKey)
    {
        const branch = await this.graph.getMessages(
            this.id, 
            this.app);

        if (!shiftKey)
        {
            const message = branch[branch.length-1];
            return message.content;
        }
        else
        {
            let result = "";

            for (let message of branch)
            {
                const messageText = message.content;

                if (!result)
                    result = messageText;
                else
                    result += "\n\n---\n\n" + messageText;
            }

            return result;
        }
    }

    parsePlaceholders(text)
    {
        const usedIns = this.getUsedIns();

        this.allIns = this.placeholders
            .clear()
            .parse(text)
            .add(usedIns)
            .get();

        this.updateNodeInternals.emit(this.id);
    }

    getUsedIns()
    {
        return this.graph.edges
            .filter((edge) => 
                edge.targetHandle && 
                edge.target === this.id)
            .map(e => e.targetHandle);
    }
}