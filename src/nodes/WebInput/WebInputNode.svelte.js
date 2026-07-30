import NodeState from '../Common/NodeState.svelte.js';

export default class WebInputNodeState extends NodeState
{
    constructor(id, graph)
    {
        super(id, graph);

        this.url = $state();
        this.title = $state();      
    }

    init(data)
    {
        super.init(data);
        
        this.url = data.url;
    }
}