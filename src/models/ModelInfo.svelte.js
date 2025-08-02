import providers from "./ProviderInfo.svelte.js"
import settings from '$lib/overlay/Settings.svelte.js';

class ModelInfo
{
    index = $state({});
    updating = $state({});
    errors = $state({});

    constructor ()
    {
        this.readLocal ();
    }

    async readLocal ()
    {
        while (!settings.Data)
            await new Promise((resolve) => setTimeout(resolve, 1));

        var self = this;
        this.defaultProvider = providers.list[0];

        providers.list.forEach(provider => 
        {
            let models = settings.GetModels(provider.id);

            models.forEach(model =>
            {
                model.providerId = provider.id;
                self.index[model.id] = model;
            });
        });
    }

    resetErrors()
    {
        this.errors = {};
    }

    async fetchModels(providerId)
    {
        if (this.updating[providerId])
            return;

        this.updating[providerId] = true;

        try
        {
            const provider = providers.index[providerId];
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
            this.errors[providerId] = ex;
        }

        this.updating[providerId] = false;
    }
}

const modelInfo = new ModelInfo();
export default modelInfo;