import NodeState from '../Common/NodeState.svelte.js';

export default class TextInputNodeState extends NodeState
{
    constructor(id, graph)
    {
        super(id, graph);

        this.value = $state();
        this.isRead = $state();      
    }

    init(data)
    {
        super.init(data);
        
        this.value = data.value;
        this.isRead = data.read ?? false;
    }
}