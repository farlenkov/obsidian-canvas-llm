import providers from "./ProviderInfo.svelte.js"
import settings from '$lib/overlay/Settings.svelte.js';

class ModelInfo
{
    Updating = $state({});
    Errors = $state({});

    constructor ()
    {
        this.readLocal ();
    }

    async readLocal ()
    {
        while (!settings.Data)
            await new Promise((resolve) => setTimeout(resolve, 1));

        providers.List.forEach(provider => 
        {
            let models = settings.GetModels(provider.id);
            provider.ModelById = {};

            models.forEach(model =>
            {
                model.providerId = provider.id;
                provider.ModelById[model.id] = model;
            });
        });
    }

    ResetErrors()
    {
        this.Errors = {};
    }

    async FetchModels(providerId)
    {
        if (this.Updating[providerId])
            return;

        this.Updating[providerId] = true;

        try
        {
            const provider = providers.ById[providerId];
            const models = await provider.FetchModels();

            models.sort((a,b) => 
            {
                if (a.id < b.id)
                    return -1;  
                else if (a.id > b.id)
                    return 1;    
                else
                    return 0;
            });

            settings.SetModels(providerId, models);
            settings.Save();
            this.readLocal ();
        }
        catch (ex)
        {
            console.log(ex);
            this.Errors[providerId] = ex;
        }

        this.Updating[providerId] = false;
    }
}

const modelInfo = new ModelInfo();
export default modelInfo;