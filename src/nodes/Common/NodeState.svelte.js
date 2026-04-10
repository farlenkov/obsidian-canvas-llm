import { PlaceholderSet } from '$lib/svelte-obsidian/src/Placeholder.js';

export default class NodeState
{
    constructor(id, data, appState, updateNodeInternals)
    {
        this.id = id;
        this.app = appState.app;
        this.appState = appState;
        this.updateNodeInternals = updateNodeInternals;

        this.placeholders = new PlaceholderSet();
        this.isTemplate = $state(data.template ?? false);
        this.allIns = $state([]);

        this.error = $state(false);
    }

    async getCopy(shiftKey)
    {
        const branch = await this.appState.graph.getMessages(
            this.id, 
            this.appState.app);

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

    toggleTemplate()
    {
        this.isTemplate = !this.isTemplate;
        this.appState.graph.updateNode(this.id, {template: this.isTemplate}, "TemplateMode");
        this.updateNodeInternals(this.id);
    }

    parsePlaceholders(text)
    {
        const usedIns = this.appState.graph.edges
            .filter((edge) => 
                edge.targetHandle && 
                edge.target === this.id)
            .map(e => e.targetHandle);

        this.allIns = this.placeholders
            .clear()
            .parse(text)
            .add(usedIns)
            .get();

        this.updateNodeInternals(this.id);
    }
}