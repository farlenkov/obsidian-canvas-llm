<script>

    import { remote } from 'electron';
    import { getContext, onMount } from 'svelte';
    import { ScanText, FileText, Globe, RotateCw, ArrowRight, ArrowLeft } from 'lucide-svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    import { Defuddle } from 'defuddle/node';
    import TurndownService from "turndown";

    import NodeState from '../Common/NodeState.svelte.js';
    import CopyTextButton from '../Common/CopyTextButton.svelte';
    import MarkdownRenderer from '../Common/MarkdownRenderer.svelte';
    import Handles from '../Common/Handles.svelte';
    import NodeResizer from '../Common/NodeResizer.svelte';

    const { Menu, MenuItem } = remote;
    const {id, data, selected} = $props();
    const appState = getContext("appState");
    const nodeState = new NodeState(id, data, appState, useUpdateNodeInternals());
    
    let url = $state(data.url);
    let title = $state("");
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

        webView.src = url;
        appState.graph.getNodeContent[id] = getMessage;
        return () => delete appState.graph.getNodeContent[id];
    });

    async function getMessage()
    {
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
        appState.graph.updateNode(id, {url: url}, "UrlChange");
        webView.src = url;
    }

    function onNavigate(e)
    {
        if (e.isMainFrame !== false)
        {
            url = webView.getURL();
            appState.graph.updateNode(id, {url: url}, "Navigate");
        }
    }

    function onTitleChange(e)
    {
        title = e.title.length > 30
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

</script>

<NodeResizer 
    minWidth={100} 
    minHeight={30} 
    placeholders={[]} />

<Handles placeholders={[]} />

<div class="canvas-node">

    <div class="canvas-node-container">
        <node-content>
            <node-header>
                <node-header-left>
                    {title || "Web" }
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
                    bind:value={url}
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