import TextInputNodeType    from '../TextInput/TextInputNodeType.js';
import FileInputNodeType    from '../FileInput/FileInputNodeType.js';
import WebInputNodeType     from '../WebInput/WebInputNodeType.js';
import GenerateNodeType     from '../Generate/GenerateNodeType.js';
import DialogueNodeType     from '../Dialogue/DialogueNodeType.js';

class NodeTypes
{
    constructor ()
    {
        this.ById = {};
        this.Views = {};

        this.List = 
        [
            new TextInputNodeType(),
            new FileInputNodeType(),
            new WebInputNodeType(),
            new GenerateNodeType(),
            new DialogueNodeType()
        ];

        for (const nodeType of this.List)
        {
            this.ById[nodeType.id] = nodeType;
            this.Views[nodeType.id] = nodeType.view;
        }
    }
}

const nodeTypes = new NodeTypes();
export default nodeTypes;