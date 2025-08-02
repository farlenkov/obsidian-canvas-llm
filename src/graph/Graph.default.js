export default function creteDefaultGraph()
{
    const node1 = (new Date).getTime().toString();
    const node2 = node1 + 1;
    const edge1 = node1 + 2;

    return {
        "nodes": 
        [
            {
                "id": node1,
                "type": "textInput",
                "position": {
                    "x": 20,
                    "y": 0
                },
                "data": {
                    "value": "What is LLM?"
                },
                "width": 180,
                "height": 100
            },
            {
                "id": node2,
                "type": "generate",
                "position": {
                    "x": 240,
                    "y": 0
                },
                "width": 460,
                "height": 340,
                "data": {
                    "markdowns": "",
                    "htmls": "",
                    "model":"gemini-2.0-flash"
                }
            }
        ],
        "edges": 
        [
            {
                "id": edge1,
                "source": node1,
                "target": node2
            }
        ]};
}