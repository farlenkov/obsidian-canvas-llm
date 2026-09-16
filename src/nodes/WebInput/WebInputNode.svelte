<script>

    import { getContext, onMount } from 'svelte';
    import { RotateCw, ArrowRight, ArrowLeft, Globe } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    import TurndownService from "turndown";

    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import Handles from '../Common/Handles.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';

    const { id } = $props();
    const viewState = getContext("viewState");
    const nodeState = viewState.graph.getNodeState(id); 
    
    let webView;

    const turndown = new TurndownService
    ({
        headingStyle: "atx",
        bulletListMarker: "-",
        codeBlockStyle: "fenced"
    });

    const userAgent = navigator.userAgent
        .replace(/\sElectron\/[\d.]+/, '')
        .replace(/\sObsidian\/[\d.]+/, '')
        .replace(/\sobsidian\/[\d.]+/, '');

    onMount(() => 
    {
        // https://www.electronjs.org/docs/latest/api/webview-tag

        webView.addEventListener("did-navigate", onNavigate);
        webView.addEventListener("did-navigate-in-page", onNavigate);
        webView.addEventListener("page-title-updated", onTitleChange);
        webView.addEventListener("did-stop-loading", async e => await onPageLoaded(e));

        // watchAllEvents();

        webView.src = nodeState.url;
        
        const updateNodeInternals = useUpdateNodeInternals();
        nodeState.updateNodeInternals.add(updateNodeInternals);
        viewState.graph.getNodeContent[id] = getMessage;

        return () => 
        {
            nodeState.updateNodeInternals.del(updateNodeInternals);
            delete viewState.graph.getNodeContent[id];
        };
    });

    async function getMessage()
    {
        const googleDocsUrl = getGoogleDocsUrl();

        if (googleDocsUrl)
        {
            const options = 
            {
                url : googleDocsUrl.url,
                throw : false
            };

            const resp = await requestUrl(options);
            const text = await resp.text;
            return { role : "user", content : `<${googleDocsUrl.type}>\n${text}\n</${googleDocsUrl.type}>` };
        }
        
        const html = await webView.executeJavaScript(`document.documentElement.outerHTML`);
        const doc = (new DOMParser).parseFromString(html, 'text/html');

        doc
            .querySelectorAll("script, style, noscript, iframe, img, svg")
            .forEach(el => el.remove());

        const markdown = turndown.turndown(doc.body.innerHTML)
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]+/g, " ");

        return { role : "user", content : markdown };
    }

    function getGoogleDocsUrl()
    {
        try 
        {
            const parsedUrl = new URL(nodeState.url);
            const isGoogleDocs = parsedUrl.hostname === "docs.google.com";

            if (isGoogleDocs)
            {
                const matchDoc = parsedUrl.pathname.match(/^\/document\/d\/([^/]+)/);
                const matchSheet = parsedUrl.pathname.match(/^\/spreadsheets\/d\/([^/]+)/);

                if (matchDoc)
                    return { type : "doc", url : `https://docs.google.com/document/d/${matchDoc[1]}/export?format=md` };

                if (matchSheet)
                {
                    // gid может быть либо в query (?gid=...), либо в hash (#gid=...)
                    const gidFromQuery = parsedUrl.searchParams.get("gid");
                    const gidFromHash = parsedUrl.hash.match(/gid=(\d+)/)?.[1];
                    const gid = gidFromQuery || gidFromHash;

                    const exportUrl = 
                        `https://docs.google.com/spreadsheets/d/${matchSheet[1]}/export?format=csv` +
                        (gid ? `&gid=${gid}` : '');

                    return { type: "csv", url: exportUrl };
                }

                // if (matchSheet)
                //     return { type : "csv", url : `https://docs.google.com/spreadsheets/d/${matchSheet[1]}/export?format=csv` };
            }
        } 
        catch (e)
        {
            console.log(e);
        }
    }

    function watchAllEvents()
    {
        const allEvents = [
            'load-commit', 'did-finish-load', 'did-fail-load', 'did-frame-finish-load',
            'did-start-loading', 'did-stop-loading', 'did-attach', 'dom-ready',
            'page-title-updated', 'page-favicon-updated', 'enter-html-full-screen',
            'leave-html-full-screen', 'console-message', 'found-in-page',
            'will-navigate', 'will-frame-navigate', 'did-start-navigation',
            'did-redirect-navigation', 'did-navigate', 'did-frame-navigate',
            'did-navigate-in-page', 'close', 'ipc-message', 'render-process-gone',
            'destroyed', 'media-started-playing', 'media-paused',
            'did-change-theme-color', 'update-target-url', 'devtools-open-url',
            'devtools-search-query', 'devtools-opened', 'devtools-closed',
            'devtools-focused', 'context-menu', 'new-window'];

        allEvents.forEach(eventName =>
        {
            webView.addEventListener(eventName, (e) => 
            {
                console.log(eventName, e);
            });
        });
    }

    function onUrlChange ()
    {
        viewState.updateNode(id, {url: nodeState.url}, "UrlChange");
        webView.src = nodeState.url;
    }

    function onNavigate(e)
    {
        if (e.isMainFrame !== false)
        {
            nodeState.url = webView.getURL();
            viewState.updateNode(id, {url: nodeState.url}, "Navigate");
        }
    }

    function onTitleChange(e)
    {
        nodeState.title = e.title.length > 30
            ? e.title.substring(0, 27) + "..."
            : e.title;
    }

    async function onPageLoaded(e)
    {
        webView.setZoomFactor(0.7);
        
        webView.executeJavaScript
        (`
            ((window, document) => {

                if (window.__canvas__llm__injected__)
                    return;

                window.__canvas__llm__injected__ = true;
                window.open = url => window.location.href = url;

                const mutationObserver = new MutationObserver(() => 
                {
                    document
                        .querySelectorAll('a[target]')
                        .forEach(a => a.removeAttribute('target'));
                });

                mutationObserver.observe(
                    document.body, 
                    { subtree: true, childList: true });

            })(window, document);
        `);
    }

    function clickBackward()
    {
        webView.goBack();
    }

    function clickForward()
    {
        webView.goForward();
    }

    function clickRefresh()
    {
        webView.reload();
    }

    function onResize(started)
    {
        if (started)
            webView.style.pointerEvents = "none";
        else
            webView.style.pointerEvents = '';
    }

</script>

<NodeResizer 
    minWidth={100} 
    minHeight={30}
    callback={onResize} />

<Handles />

<div class="canvas-node">

    <div class="canvas-node-container">
        <node-content>
            <node-header>
                <node-header-left>
                    {#if nodeState.title}
                        {nodeState.title}
                    {:else}
                        <Globe size={16}/> Web
                    {/if}
                    <!-- {nodeState.title || "🌐 Web" } -->
                </node-header-left>
                <node-header-right>

                    <button 
                        class="clickable-icon"
                        aria-label="Backward" 
                        onclick={clickBackward}>
                        <ArrowLeft size={16}/>  
                    </button>

                    <button 
                        class="clickable-icon"
                        aria-label="Forward" 
                        onclick={clickForward}>
                        <ArrowRight size={16}/>  
                    </button>

                    <button 
                        class="clickable-icon"
                        aria-label="Refresh" 
                        onclick={clickRefresh}>
                        <RotateCw size={16}/>  
                    </button>

                    <CopyTextButton {nodeState} />
                </node-header-right>
            </node-header>

            <node-body>

                <input 
                    bind:value={nodeState.url}
                    type="url"
                    onchange={onUrlChange}
                    class="nodrag nozoom node-text" />

                <webview
                    allowpopups
                    useragent={userAgent} 
                    partition="persist:canvas-llm"
                    bind:this={webView}></webview>

            </node-body>

        </node-content>
    </div>
</div>