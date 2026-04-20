<script>
  import { onDestroy, onMount } from "svelte";

  const DATAVIEWER_ORIGIN = "https://dataviewer.dev";

  export let vtiArtifacts = [];
  export let geometryArtifacts = [];
  export let selectedStepIndex = 0;
  export let resultsDimension = null;
  export let sliceAxis = "z";
  export let theme = "light";

  let iframeEl;
  let iframeSrc = `${DATAVIEWER_ORIGIN}/?embed=1&tabs=0&theme=${theme}`;
  let destroyed = false;
  let ready = false;
  let loading = true;
  let errorMessage = "";
  let lastResultsSignature = "";
  let lastStepIndex = -1;
  let lastSliceAxis = "";
  let resolvedSteps = [];
  let resolvedObstacles = [];
  let inlineAssetSignature = "";
  let assetLoadToken = 0;
  let stepRetryTimer = null;

  function postToViewer(payload) {
    if (!iframeEl?.contentWindow) return;
    iframeEl.contentWindow.postMessage(payload, DATAVIEWER_ORIGIN);
  }

  function clearStepRetry() {
    if (stepRetryTimer) {
      clearTimeout(stepRetryTimer);
      stepRetryTimer = null;
    }
  }

  function buildResultsDoc() {
    return {
      namespace: "qlbm",
      version: 1,
      kind: "results",
      dimension: typeof resultsDimension === "string" ? resultsDimension : null,
      steps: resolvedSteps,
      obstacles: resolvedObstacles,
      view: typeof resultsDimension === "string" && resultsDimension.toUpperCase() === "2D"
        ? { preset: "xy" }
        : {}
    };
  }

  function buildResultsSignature() {
    return JSON.stringify({
      dimension: resultsDimension || null,
      steps: resolvedSteps.map((item) => item.name || item.id || ""),
      geometry: resolvedObstacles.map((item) => item.name || item.id || "")
    });
  }

  function buildInlineAssetSignature() {
    return JSON.stringify({
      steps: vtiArtifacts.map((item) => item.url || item.path || ""),
      geometry: geometryArtifacts.map((item) => item.url || item.path || "")
    });
  }

  function mimeTypeForArtifact(path) {
    const lower = String(path || "").toLowerCase();
    if (lower.endsWith(".vti")) {
      return "application/vnd.vtk.xml";
    }
    if (lower.endsWith(".stl")) {
      return "model/stl";
    }
    return "application/octet-stream";
  }

  function arrayBufferToDataUrl(buffer, mimeType) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
      const chunk = bytes.subarray(index, index + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return `data:${mimeType};base64,${btoa(binary)}`;
  }

  async function resolveArtifact(item, idPrefix, index) {
    const response = await fetch(item.url);
    if (!response.ok) {
      throw new Error(`Failed to load ${item.path || item.url}: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    return {
      id: `${idPrefix}-${index}`,
      name: item.path || `${idPrefix}_${index}`,
      url: arrayBufferToDataUrl(buffer, mimeTypeForArtifact(item.path))
    };
  }

  async function loadInlineArtifacts() {
    const nextSignature = buildInlineAssetSignature();
    if (nextSignature === inlineAssetSignature) {
      return;
    }

    const token = ++assetLoadToken;
    inlineAssetSignature = nextSignature;
    loading = true;
    errorMessage = "";

    try {
      const [steps, obstacles] = await Promise.all([
        Promise.all(vtiArtifacts.map((item, index) => resolveArtifact(item, "step", index))),
        Promise.all(geometryArtifacts.map((item, index) => resolveArtifact(item, "obstacle", index)))
      ]);

      if (destroyed || token !== assetLoadToken) {
        return;
      }

      resolvedSteps = steps;
      resolvedObstacles = obstacles;
      loading = false;
    } catch (error) {
      if (destroyed || token !== assetLoadToken) {
        return;
      }

      resolvedSteps = [];
      resolvedObstacles = [];
      loading = false;
      errorMessage = `Failed to load local results artifacts: ${error.message}`;
    }
  }

  function pushResults() {
    if (!ready) return;
    if (!resolvedSteps.length) return;
    const signature = buildResultsSignature();
    if (signature === lastResultsSignature) return;
    lastResultsSignature = signature;

    try {
      postToViewer({ type: "qlbm:setResults", results: buildResultsDoc(), fit: true });
      lastStepIndex = -1;
      lastSliceAxis = "";
      errorMessage = "";
      clearStepRetry();
      stepRetryTimer = setTimeout(() => {
        pushStep(true);
      }, 180);
    } catch (error) {
      errorMessage = `Failed to load results: ${error.message}`;
    }
  }

  function pushStep(force = false) {
    if (!ready) return;
    if (!resolvedSteps.length) return;
    const clampedIndex = Math.max(0, Math.min(resolvedSteps.length - 1, Number(selectedStepIndex) || 0));
    if (!force && clampedIndex === lastStepIndex) return;
    lastStepIndex = clampedIndex;

    try {
      postToViewer({ type: "qlbm:setResultsStep", index: clampedIndex });
      errorMessage = "";
      clearStepRetry();
      stepRetryTimer = setTimeout(() => {
        if (!destroyed && ready) {
          postToViewer({ type: "qlbm:setResultsStep", index: clampedIndex });
        }
      }, 120);
    } catch (error) {
      errorMessage = `Failed to set results step: ${error.message}`;
    }
  }

  function pushSliceAxis() {
    if (!ready) return;
    const axis = String(sliceAxis || "").toLowerCase();
    if (!axis || axis === lastSliceAxis) return;
    lastSliceAxis = axis;

    try {
      postToViewer({ type: "qlbm:setResultsSliceAxis", axis });
      errorMessage = "";
    } catch (error) {
      errorMessage = `Failed to set slice axis: ${error.message}`;
    }
  }

  function handleMessage(event) {
    if (event.origin !== DATAVIEWER_ORIGIN) return;
    if (!event.data) return;
    if (event.data.type === "ready") {
      ready = true;
      loading = false;
      pushResults();
      pushStep();
      pushSliceAxis();
      try {
        postToViewer({ type: "setTheme", theme });
      } catch {}
    }
  }

  onMount(() => {
    window.addEventListener("message", handleMessage);
    loading = true;
    errorMessage = "";
    iframeSrc = `${DATAVIEWER_ORIGIN}/?embed=1&tabs=0&theme=${theme}`;
    loadInlineArtifacts();

    setTimeout(() => {
      if (!destroyed && !ready && !errorMessage) {
        errorMessage = "DataViewer did not become ready. Reload the page or check the network connection.";
        loading = false;
      }
    }, 8000);
  });

  onDestroy(() => {
    destroyed = true;
    clearStepRetry();
    window.removeEventListener("message", handleMessage);
    try {
      postToViewer({ type: "qlbm:clearResults" });
    } catch {}
  });

  $: if (ready) {
    try {
      postToViewer({ type: "setTheme", theme });
    } catch {}
  }

  $: inlineSourceSignature = buildInlineAssetSignature();
  $: if (inlineSourceSignature) loadInlineArtifacts();

  $: resultsSignature = buildResultsSignature();
  $: if (ready && resolvedSteps.length && resultsSignature) pushResults();

  $: stepSyncKey = `${selectedStepIndex}:${resolvedSteps.length}`;
  $: if (ready && resolvedSteps.length && stepSyncKey) pushStep();

  $: sliceAxisKey = String(sliceAxis || "").toLowerCase();
  $: if (ready && sliceAxisKey) pushSliceAxis();
</script>

<div class="relative h-full w-full min-h-[420px]">
  <iframe
    bind:this={iframeEl}
    src={iframeSrc}
    title="Results viewer"
    class="absolute inset-0 h-full w-full rounded-lg overflow-hidden border border-border bg-surface-0"
    style="border:0;"
    allow="fullscreen"></iframe>

  {#if loading}
    <div class="absolute inset-3 flex items-center justify-center rounded-lg border border-border bg-surface-1/80 backdrop-blur-sm">
      <div class="text-center">
        <div class="text-[0.72rem] font-mono font-bold uppercase tracking-[0.18em] text-accent-strong">Loading viewer</div>
        <div class="mt-2 text-sm text-ink-muted">Preparing timestep and obstacle artifacts...</div>
      </div>
    </div>
  {/if}

  {#if errorMessage}
    <div class="absolute inset-x-3 bottom-3 rounded-md border border-bad/30 bg-bad-glow text-bad text-[0.7rem] px-3 py-2">
      {errorMessage}
    </div>
  {/if}
</div>
