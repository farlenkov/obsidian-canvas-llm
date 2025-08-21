import settings from '$lib/settings/Settings.svelte.js';
import Provider from './provider.js';

class Alibaba extends Provider
{
    id = "alibaba";
    name = "Alibaba";
    keys = "https://modelstudio.console.alibabacloud.com/?tab=playground#/api-key";
    models = "https://www.alibabacloud.com/help/en/model-studio/models";
    untested = true;

    // https://www.alibabacloud.com/help/en/model-studio/models

    GetFetchUrl()
    {
        return "https://github.com/farlenkov/obsidian-canvas-llm/raw/refs/heads/master/assets/data/qwen.json";
    }

    GetFetchHeaders()
    {
        return {};
    }

    ReadModel(model)
    {
        model.owner = this.name;
        return model;
    }

    // https://www.alibabacloud.com/help/en/model-studio/multi-round-conversation

    GetModelUrl(model)
    {
        return "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
    }

    GetModelHeaders()
    {
        return {
            "Content-Type" : "application/json",
            "Authorization" : "Bearer " + settings.Data.alibabaKey
        };
    }
}

export default new Alibaba();