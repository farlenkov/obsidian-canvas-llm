export default class GenerateNodeParams
{
    NodeID = $state(0);
    ModelID = $state("");
    ProviderID = $state("");
    ProviderTab = $state("");

    FilterName = $state("");
    FilterFree = $state(false);
    IsVisible = $derived(this.NodeID > 0);

    Show (nodeId, providerId, modelId) 
    {
        this.NodeID = nodeId;
        this.ModelID = modelId;
        this.ProviderID = providerId;
    }

    Hide ()
    {
        this.NodeID = 0;
    }
}