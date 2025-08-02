export default function creteDefaultGraph()
{
    const time = (new Date).getTime();
    const node1 = (time + 1).toString();
    const node2 = (time + 2).toString();
    const edge1 = (time + 3).toString();

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