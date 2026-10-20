export default class ListSet
{
    constructor()
    {
        this.items = {};
    }

    getSingle(id)
    {
        if (this.items[id]?.length)
            return this.items[id][0];
        else
            return null;
    }

    add(id, item)
    {
        if (this.items[id])
            this.items[id].push(item);
        else
            this.items[id] = [item];
    }

    del(id, item)
    {
        if (this.items[id])
            this.items[id] = this.items[id].filter(item2 => item2 != item);
    }
}