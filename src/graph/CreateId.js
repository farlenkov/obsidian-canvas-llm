let prevId = 0;

export function createNodeId()
{
    let newId = (new Date).getTime();

    if (newId === prevId)
        newId++;

    prevId = newId;
    return newId.toString();
}

export function createEdgeId(sourceId, targetId)
{
    return createNodeId();
    // return `xy-edge__${sourceId}-${targetId}`;
}