import providers from "$lib/models/ProviderInfo.svelte.js"

const DEFAULT_SETTINGS = 
{
    defaultModel : "gemini-2.0-flash",
    defaultProvider : "google",
    launchCounter : 0
};

class SettingsState
{
    IsVisible = $state(false);
    Data = $state();

    async Init(plugin)
    {
        this.plugin = plugin;
        this.Data = Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
        this.Data.launchCounter++;
        this.Save();

        // CheckApiKey

        // if (this.Data.launchCounter == 1)
        // {
        //     let needToShowSettings = true;

        //     for (let i = 0; i < providers.List.length; i++)
        //     {
        //         let provider = providers.List[i];

        //         if (this.HasKey(provider.id))
        //         {
        //             needToShowSettings = false;
        //             break;
        //         }
        //     }

        //     if (needToShowSettings)
        //         this.Show();
        // }
    }

    async Save()
    {
        await this.plugin.saveData(this.Data);
    }

    Show () 
    {
        this.IsVisible = true;
    }

    Hide ()
    {
        this.IsVisible = false;
    }

    // API KEYS

    HasKey (providerId)
    {
        return this.Data[providerId + "Key"] ? true : false;
    }

    GetKey (providerId)
    {
        return this.Data[providerId + "Key"];
    }

    // AI MODELS

    HasModels (providerId)
    {
        let models = this.Data[providerId + "Models"];

        if (!models)
            return false;
        else
            return models.length > 0;
    }

    GetModels (providerId)
    {
        return this.Data[providerId + "Models"] || [];
    }

    SetModels (providerId, models)
    {
        return this.Data[providerId + "Models"] = models;
    }
}

const settings = new SettingsState();
export default settings;