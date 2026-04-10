import TextInputNodeType    from '../TextInput/TextInputNodeType.js';
import FileInputNodeType    from '../FileInput/FileInputNodeType.js';
import WebInputNodeType     from '../WebInput/WebInputNodeType.js';
import GenerateNodeType     from '../Generate/GenerateNodeType.js';
import DialogueNodeType     from '../Dialogue/DialogueNodeType.js';

class NodeTypes
{
    constructor ()
    {
        this.List = 
        [
            new TextInputNodeType(),
            new FileInputNodeType(),
            new WebInputNodeType(),
            new GenerateNodeType(),
            new DialogueNodeType()
        ];

        this.ById = {};
        this.List.forEach(nodeType => this.ById[nodeType.id] = nodeType);
    }
}

const nodeTypes = new NodeTypes();
export default nodeTypes;