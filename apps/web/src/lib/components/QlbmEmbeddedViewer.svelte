<script>
  import { onDestroy, onMount, tick } from "svelte";
  import { caseToQlbmDoc, getVisibleFacesForCase } from "../viewer/caseToQlbmDoc.js";

  export let caseData;
  export let highlightId = null;
  export let theme = "light";

  const DATAVIEWER_ORIGIN = "https://dataviewer.dev";
  let iframeEl;
  let iframeSrc = `${DATAVIEWER_ORIGIN}/?embed=1&tabs=0&theme=${theme}`;
  let destroyed = false;
  let ready = false;
  let lastHighlight = null;
  let lastCaseSignature = "";
  let errorMessage = "";
  let loading = true;

  function postToViewer(payload) {
    if (!iframeEl?.contentWindow) return;
    iframeEl.contentWindow.postMessage(payload, DATAVIEWER_ORIGIN);
  }

  function handleMessage(event) {
    if (event.origin !== DATAVIEWER_ORIGIN) return;
    if (!event.data) return;
    if (event.data.type === "ready") {
      ready = true;
      loading = false;
      pushCase(true);
      applyHighlight();
    }
  }

  async function init() {
    loading = true;
    errorMessage = "";
    iframeSrc = `${DATAVIEWER_ORIGIN}/?embed=1&tabs=0&theme=${theme}`;
    await tick();
    setTimeout(() => {
      if (!destroyed && !ready && !errorMessage) {
        errorMessage = "DataViewer did not become ready. Reload the page or check the network connection.";
        loading = false;
      }
    }, 8000);
  }

  function pushCase(fit = false) {
    if (!ready || !caseData) return;
    try {
      const doc = caseToQlbmDoc(caseData);
      const signature = JSON.stringify(doc);
      if (!fit && signature === lastCaseSignature) return;
      lastCaseSignature = signature;
      postToViewer({ type: "qlbm:setCase", case: doc, fit });
      postToViewer({ type: "qlbm:setVisibleFaces", faces: getVisibleFacesForCase(caseData) });
      if (fit) {
        postToViewer({ type: "qlbm:fitDomain" });
      }
      errorMessage = "";
    } catch (error) {
      errorMessage = `Failed to push case: ${error.message}`;
    }
  }


  function applyHighlight() {
    if (!ready) return;
    if (highlightId === lastHighlight) return;
    lastHighlight = highlightId;
    try {
      postToViewer({ type: "qlbm:highlightEntity", id: highlightId || null });
    } catch {
      // highlight is best-effort
    }
  }

  onMount(() => {
    window.addEventListener("message", handleMessage);
    init();
  });

  onDestroy(() => {
    destroyed = true;
    window.removeEventListener("message", handleMessage);
    try {
      postToViewer({ type: "qlbm:clearCase" });
    } catch {
      // ignore teardown errors
    }
    lastCaseSignature = "";
  });

  $: if (ready && caseData) pushCase(false);
  $: if (ready) applyHighlight();
  $: if (ready) {
    try { postToViewer({ type: "setTheme", theme }); } catch {}
  }
</script>

<div class="relative h-full w-full min-h-[320px]">
  <iframe
    bind:this={iframeEl}
    src={iframeSrc}
    title="QLBM viewer"
    class="absolute inset-0 h-full w-full rounded-lg overflow-hidden border border-border bg-surface-0"
    style="border:0;"
    allow="fullscreen"></iframe>
  {#if loading}
    <div class="absolute inset-3 flex items-center justify-center rounded-lg border border-border bg-surface-1/80 backdrop-blur-sm">
      <div class="text-center">
        <div class="text-[0.72rem] font-mono font-bold uppercase tracking-[0.18em] text-accent-strong">Loading viewer</div>
        <div class="mt-2 text-sm text-ink-muted">Preparing the QLBM preview...</div>
      </div>
    </div>
  {/if}
  {#if errorMessage}
    <div class="absolute inset-x-3 bottom-3 rounded-md border border-bad/30 bg-bad-glow text-bad text-[0.7rem] px-3 py-2">
      {errorMessage}
    </div>
  {/if}
</div>
