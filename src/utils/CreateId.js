let prevId = 0;

export function CreateNodeId()
{
    let newId = (new Date).getTime();

    if (newId === prevId)
        newId++;

    prevId = newId;
    return newId.toString();
}

export function CreateEdgeId(sourceId, targetId)
{
    return `xy-edge__${sourceId}-${targetId}`;
}