import providers from '$lib/svelte-llm/models/ProviderInfo.js';
import aiClient from '$lib/svelte-llm/models/AiClient.js';
import NodeState from '../Common/NodeState.svelte.js';
import { GalleryThumbnailsIcon } from 'lucide-svelte/dist/lucide-svelte.js';

export default class GenerateNodeState extends NodeState
{
    constructor(id, graph)
    {
        super(id, graph);

        this.results = $state();
        this.activeTab = $state();
        this.providerId = $state();
        this.modelId = $state();
        this.provider = $state();
        this.model = $state();

        this.hasThink = $state(false);
        this.showThink = $state(false);
        this.inProgress = $state(false);
        this.errorMessage = $state("");
        this.textToRender = $state("");

        $effect(() => { this.updatevProviderAndModel(); });
    }

    async init(data)
    {
        super.init(data);
        
        this.results = data.results ?? [];
        this.activeTab = data.part ?? 0;
        this.providerId = data.provider;
        this.modelId = data.model;

        this.updatevProviderAndModel();
        this.updateCurrentText();
    }

    async updatevProviderAndModel()
    {
        while (!providers.List)
            await new Promise(resolve => setTimeout(resolve, 1));

        this.provider = providers.ById[this.providerId]; 
        this.model = this.provider ? this.provider.ModelById[this.modelId] : null;
    }

    updateCurrentText()
    {
        if (this.results.length <= this.activeTab)
        {
            this.textToRender = "";
            return;
        }

        const result = this.results[this.activeTab];
        this.textToRender = this.showThink ? result.think : result.text;
        this.hasThink = result.think ? true : false;
    }

    async generate()
    {
        this.inProgress = true;

        try
        {
            const messages = (await this.graph
                .getMessages(this.id, this.app))
                .slice(0, -1);

            if (messages.length == 0)
                throw "Prompt is empty. Please connect some Input node with content.";
            
            const result = await aiClient.callModel(
                this.providerId, 
                this.modelId, 
                messages, 
                this.graph.plugin.mcp);

            result.provider = this.providerId;
            result.model = this.modelId;

            const oldResults = this.results.filter(md => md ? true : false);
            this.results = [...oldResults, result];            
            this.activeTab = this.results.length - 1;
        }
        catch (err)
        {
            this.errorMessage = err;
            // throw err;
        }

        this.inProgress = false;
        this.updateCurrentText();
    }

    nextPart()
    {
        this.activeTab = (this.activeTab + 1) % this.results.length;
        this.showThink = false;
        this.updateCurrentText();

        // viewState.saveGraph("NextPart");
        // renderHtml(data.results);
    }

    toggleThink(value)
    {
        this.showThink = value;
        this.updateCurrentText();
        // renderHtml(data.results);
    }

    upgradeNode(data)
    {
        // model to provider

        if (data.model &&
            !data.provider)
        {
            providers.List.forEach(provider => 
            {
                if (provider.ModelById[data.model])
                    data.provider = provider.id;
            });
        }

        // remove html & htmls
            
        if (data.html)
            delete node.data.html;

        if (data.htmls)
            delete node.data.htmls;

        // markdown to markdowns

        if (data.markdown)
        {
            data.markdowns = [data.markdown];
            delete data.markdown;
        }

        // markdowns to results

        if (data.markdowns)
        {
            data.results = [];

            for (const markdown of data.markdowns)
            {
                const result = 
                {
                    provider : data.provider,
                    model : data.model,
                    text : markdown
                };

                if (Array.isArray(markdown))
                {
                    result.think = markdown[0];
                    result.text = markdown[1];
                }

                data.results.push(result);
            }

            delete data.markdowns;
        }     
    }
}