<script>
  export let currentView = "runs";
  export let helperConnected = false;
  export let helperAddress = "";
  export let connectionNotice = "";
  export let currentRun = null;
  export let timestepCount = 0;
  export let onNavigate;

  const viewLabels = {
    runs: {
      label: "Run Queue",
      description: "Manage local helper runs and reopen their artifacts."
    },
    setup: {
      label: "Case Builder",
      description: "Define the domain, initial conditions, and obstacle geometry."
    },
    results: {
      label: "Results",
      description: "Inspect logs, timestep outputs, and generated artifacts."
    }
  };

  $: viewMeta = viewLabels[currentView] || viewLabels.runs;
</script>

<header class="min-h-[92px] flex-shrink-0 border-b border-border bg-surface-1/55 flex items-start justify-between px-6 py-4 gap-5">
  <div class="min-w-0">
    <div class="flex items-center gap-3 min-w-0">
      <span class="text-[0.65rem] font-mono uppercase tracking-[0.12em] text-ink-faint">qlbmUI</span>
      <span class="text-ink-faint/40">/</span>
      <span class="text-sm font-semibold text-ink truncate">{viewMeta.label}</span>
    </div>
    <p class="mt-2 text-sm text-ink-muted max-w-2xl leading-relaxed">{viewMeta.description}</p>
  </div>

  <div class="flex items-center gap-2 flex-wrap justify-end">
    {#if connectionNotice}
      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-[0.7rem] text-ink-muted font-mono">
        {connectionNotice}
      </span>
    {/if}

    {#if helperAddress}
      <span class="hidden xl:inline px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-[0.7rem] text-ink-faint font-mono truncate max-w-[240px]">{helperAddress}</span>
    {/if}

    {#if currentRun}
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-border">
        <span class="text-[0.65rem] uppercase tracking-wider text-ink-faint">Run</span>
        <span class="text-[0.7rem] font-mono text-ink-muted">{currentRun.run_id.slice(0, 8)}</span>
        <span class="w-1.5 h-1.5 rounded-full {currentRun.status === 'completed' ? 'bg-good' : currentRun.status === 'failed' ? 'bg-bad' : 'bg-warn animate-pulse-dot'}"></span>
      </div>
    {/if}

    {#if timestepCount > 0}
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-border">
        <span class="text-[0.65rem] uppercase tracking-wider text-ink-faint">Frames</span>
        <span class="text-[0.7rem] font-mono text-accent">{timestepCount}</span>
      </div>
    {/if}

    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold
        {helperConnected
          ? 'border-good/20 bg-good-glow text-good hover:border-good/40'
          : 'border-bad/20 bg-bad-glow text-bad hover:border-bad/40'}"
      on:click={() => onNavigate("connect")}>
      <span class="w-1.5 h-1.5 rounded-full {helperConnected ? 'bg-good animate-pulse-dot' : 'bg-bad'}"></span>
      {helperConnected ? "Online" : "Offline"}
    </button>
  </div>
</header>
