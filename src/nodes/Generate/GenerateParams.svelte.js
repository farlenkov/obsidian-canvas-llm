class GenerateParams
{
    NodeID = $state(0);
    ModelID = $state("");
    FilterName = $state("");
    FilterFree = $state(false);
    IsVisible = $derived(this.NodeID > 0);

    Show (nodeId, providerId, modelId) 
    {
        this.NodeID = nodeId;
        this.ProviderID = providerId;
        this.ModelID = modelId;
    }

    Hide ()
    {
        this.NodeID = 0;
    }
}

const params = new GenerateParams();
export default params;