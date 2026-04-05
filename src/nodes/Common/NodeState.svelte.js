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