let prevId = 0;

export function createId()
{
    let newId = (new Date).getTime();

    if (newId === prevId)
        newId++;

    prevId = newId;
    return newId.toString();
}

export function createNodeId()
{
    return createId()
}

export function createEdgeId(sourceId, targetId)
{
    return createId();
    // return `xy-edge__${sourceId}-${targetId}`;
}