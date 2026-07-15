import providers from '$lib/svelte-llm/models/ProviderInfo.svelte.js';
import NodeState from '../Common/NodeState.svelte.js';

export default class GenerateNodeState extends NodeState
{
    constructor(id, data, appState, updateNodeInternals)
    {
        super(id, data, appState, updateNodeInternals);
    }

    upgradeNode(id, data)
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