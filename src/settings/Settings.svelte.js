import providers from "$lib/models/ProviderInfo.svelte.js"
import CanvasModal from '$lib/obsidian/CanvasModal.js';
import SettingsView from '$lib/settings/Settings.svelte';

const DEFAULT_SETTINGS = 
{
    defaultModel : "gemini-2.0-flash",
    defaultProvider : "google",
    recentModels : []
};

class SettingsState
{
    fileVersion = 1;
    Data = $state();

    async Init (plugin)
    {
        this.plugin = plugin;
        this.Data = Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
        this.Data.version = this.fileVersion;
        this.Save();
    }

    async Save ()
    {
        await this.plugin.saveData(this.Data);
    }

    Show (appState)
    {
        new CanvasModal(appState, SettingsView, "settings").open();
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

    AddRecentModel (model)
    {
        try
        {
            for (var i = 0; i < this.Data.recentModels.length; i++)
            {
                var recentModel = this.Data.recentModels[i];

                if (recentModel.providerId == model.providerId &&
                    recentModel.id == model.id)
                {
                    this.Data.recentModels.splice(i, 1);
                    i--
                }
            }

            this.Data.recentModels.unshift(model);

            while (this.Data.recentModels.length > 14)
                this.Data.recentModels.splice(13, 1);

            this.Save();
        }
        catch (ex)
        {
            console.error(ex);
        }
    }

    GetDefaultModel ()
    {
        if (!this.Data.recentModels ||
            this.Data.recentModels.length == 0)
        {
            return {
                providerId : this.Data.defaultProvider,
                id : this.Data.defaultModel
            };
        }
        else
        {
            return this.Data.recentModels[0];
        }
    }
}

const settings = new SettingsState();
export default settings;