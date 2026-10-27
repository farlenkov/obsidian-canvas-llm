export default class TemplatingMenuItem
{
    icon = "braces";
    title = "Templating";
    label = "Type {{ name }} to insert a placeholder";

    constructor(viewState, nodeState)
    {
        this.app = viewState.app;
        this.viewState = viewState;
        this.nodeState = nodeState;
        this.checked = nodeState.isTemplate;
        this.accent = nodeState.isTemplate;
    }
            
    onclick()
    {
        this.nodeState.isTemplate = !this.nodeState.isTemplate;
        this.nodeState.updateNodeInternals.emit(this.nodeState.id);

        this.viewState.updateNode(
            this.nodeState.id, 
            { template : this.nodeState.isTemplate }, 
            "TemplateMode");
    }
}