class ContextMenuState
{
    IsVisible = $state(false);
    Node = $state(null);
    Edge = $state(null);

    Top = $state(undefined);
    Left = $state(undefined);
    Right = $state(undefined);
    Bottom = $state(undefined);

    CanvasWidth = $state(0);
    CanvasHeight = $state(0);

    ShowPane (event) { this.#Show(event); }

    ShowNode (event, node) { this.#Show(event, node); }

    ShowEdge (event, edge) { this.#Show(event, null, edge); }

    ShowConnect(event, connection) { this.#Show(event, null, null, connection); }

    #Show (event, node, edge, connection) 
    {
        const noContextMenu = event.target.closest(".nomenu");

        if (noContextMenu)
        {
            this.Hide();
            return;
        }

        this.Event = event;
        this.Node = node;
        this.Edge = edge;
        this.Connection = connection;
        event.preventDefault(); 

        const rootEl = event.target.closest(".svelte-flow");
        const rootRect = rootEl.getBoundingClientRect();
        const clientX = event.clientX - rootRect.left;
        const clientY = event.clientY - rootRect.top;

        this.Top = clientY < this.CanvasHeight - 200 ? clientY + "px" : undefined,
        this.Left = clientX < this.CanvasWidth - 200 ? clientX + "px" : undefined,
        this.Right = clientX >= this.CanvasWidth - 200 ? (this.CanvasWidth - clientX) + "px" : undefined,
        this.Bottom = clientY >= this.CanvasHeight - 200 ? (this.CanvasHeight - clientY) + "px" : undefined
        
        this.IsVisible = true;
    }

    Hide ()
    {
        if (this.IsVisible)
        {
            this.Event = null;
            this.Node = null;
            this.Edge = null;
            this.IsVisible = false;
        }
    }
}

const contextMenu = new ContextMenuState();
export default contextMenu;