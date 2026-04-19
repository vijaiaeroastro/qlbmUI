<script>
  import { onDestroy, onMount, tick } from "svelte";
  import { caseToQlbmDoc } from "../viewer/caseToQlbmDoc.js";

  export let caseData;
  export let highlightId = null;
  export let theme = "dark";

  let container;
  let containerId = `qlbm-embed-${Math.random().toString(36).slice(2, 10)}`;
  let viewer = null;
  let destroyed = false;
  let ready = false;
  let lastHighlight = null;
  let errorMessage = "";

  async function waitForEmbedApi() {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (window.DataViewerEmbed?.create) return true;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return Boolean(window.DataViewerEmbed?.create);
  }

  async function init() {
    const available = await waitForEmbedApi();
    if (destroyed || !container) return;
    if (!available) {
      errorMessage = "DataViewer embed script failed to load. Check your network connection.";
      return;
    }

    try {
      viewer = window.DataViewerEmbed.create({
        container: `#${containerId}`,
        baseOrigin: "https://dataviewer.dev",
        height: "100%",
        theme,
        panel: false,
        tabs: false
      });
    } catch (error) {
      errorMessage = `Failed to create viewer: ${error.message}`;
      return;
    }

    await tick();
    ready = true;
    pushCase(true);
    applyHighlight();
  }

  function pushCase(fit = false) {
    if (!ready || !viewer?.qlbm || !caseData) return;
    try {
      const doc = caseToQlbmDoc(caseData);
      viewer.qlbm.setCase(doc, { fit });
    } catch (error) {
      errorMessage = `Failed to push case: ${error.message}`;
    }
  }

  function applyHighlight() {
    if (!ready || !viewer?.qlbm) return;
    if (highlightId === lastHighlight) return;
    lastHighlight = highlightId;
    try {
      if (highlightId) {
        viewer.qlbm.highlightEntity(highlightId);
      } else {
        viewer.qlbm.highlightEntity(null);
      }
    } catch {
      // highlight is best-effort
    }
  }

  onMount(() => {
    init();
  });

  onDestroy(() => {
    destroyed = true;
    try {
      viewer?.qlbm?.clearCase?.();
      viewer?.destroy?.();
    } catch {
      // ignore teardown errors
    }
    viewer = null;
  });

  $: if (ready && caseData) pushCase(false);
  $: if (ready) applyHighlight();
  $: if (ready && viewer?.setTheme) {
    try { viewer.setTheme(theme); } catch {}
  }
</script>

<div class="relative h-full w-full min-h-[320px]">
  <div id={containerId} bind:this={container} class="absolute inset-0 rounded-lg overflow-hidden border border-border bg-surface-0"></div>
  {#if errorMessage}
    <div class="absolute inset-x-3 bottom-3 rounded-md border border-bad/30 bg-bad-glow text-bad text-[0.7rem] px-3 py-2">
      {errorMessage}
    </div>
  {/if}
</div>
