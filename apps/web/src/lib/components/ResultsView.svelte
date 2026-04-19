<script>
  import CodeBlock from "./CodeBlock.svelte";

  export let run = null;
  export let artifacts = [];
  export let vtiArtifacts = [];
  export let geometryArtifacts = [];
  export let selectedStepIndex = 0;
  export let isPlaying = false;
  export let onBack;
  export let onRefresh;
  export let onSelectStep;
  export let onTogglePlayback;
  export let onStepDelta;

  const interestingArtifacts = ["lattice.json", ".vti", ".stl"];

  function keepArtifact(item) {
    return interestingArtifacts.some((suffix) => item.path.endsWith(suffix));
  }

  $: selectedArtifact = vtiArtifacts[selectedStepIndex] || null;
</script>

<div class="grid grid-cols-1 lg:grid-cols-[minmax(300px,380px)_1fr] gap-4 animate-fade-in">
  <!-- Left panel: run info -->
  <section class="rounded-xl border border-border bg-surface-2 p-4 space-y-4 overflow-auto max-h-[calc(100vh-8rem)]">
    <div class="flex gap-2">
      <button
        class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink hover:border-border-hover transition-colors cursor-pointer"
        on:click={onBack}>
        Back
      </button>
      <button
        class="px-3 py-1.5 text-xs font-bold rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
        on:click={onRefresh}>
        Refresh
      </button>
    </div>

    {#if run}
      <div>
        <h2 class="text-sm font-display font-bold text-ink">Results</h2>
        <p class="mt-0.5 text-xs text-ink-faint">Logs and artifacts from the local helper.</p>
      </div>

      <!-- Status badge -->
      <span class="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider px-2 py-1 rounded-lg
        {run.status === 'completed' ? 'text-good bg-good-glow border border-good/20' : run.status === 'failed' ? 'text-bad bg-bad-glow border border-bad/20' : 'text-warn bg-warn/10 border border-warn/15'}">
        <span class="w-1.5 h-1.5 rounded-full
          {run.status === 'completed' ? 'bg-good' : run.status === 'failed' ? 'bg-bad' : 'bg-warn animate-pulse-dot'}"></span>
        {run.status}
      </span>

      <!-- Run metadata -->
      <div class="space-y-2">
        {#each [
          ["Run ID", run.run_id],
          ["Created", new Date((run.created_at || 0) * 1000).toLocaleString()],
          ["Return code", run.returncode ?? "-"]
        ] as [label, value]}
          <div class="flex items-center justify-between gap-3 pb-2 border-b border-border/50">
            <span class="text-[0.7rem] text-ink-faint">{label}</span>
            <span class="text-xs font-mono text-ink-muted truncate max-w-[200px]">{value}</span>
          </div>
        {/each}
      </div>

      <!-- Playback controls -->
      <div class="space-y-3">
        <h3 class="text-xs font-display font-bold text-ink">Playback</h3>
        <div class="flex gap-1.5">
          <button
            class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!vtiArtifacts.length}
            on:click={() => onStepDelta(-1)}>
            Prev
          </button>
          <button
            class="px-4 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed
              {isPlaying
                ? 'border-warn/30 bg-warn/10 text-warn hover:bg-warn/15'
                : 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20'}"
            disabled={!vtiArtifacts.length}
            on:click={onTogglePlayback}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!vtiArtifacts.length}
            on:click={() => onStepDelta(1)}>
            Next
          </button>
        </div>

        {#if vtiArtifacts.length}
          <div class="space-y-1.5">
            <label for="step-range" class="text-[0.7rem] font-semibold text-ink-faint">
              Timestep <span class="font-mono text-accent">{selectedStepIndex + 1}</span> of <span class="font-mono">{vtiArtifacts.length}</span>
            </label>
            <input
              id="step-range"
              type="range"
              min="0"
              max={vtiArtifacts.length - 1}
              step="1"
              value={selectedStepIndex}
              on:input={(event) => onSelectStep(Number(event.currentTarget.value))}
              class="w-full h-1.5 rounded-full appearance-none bg-surface-4 accent-accent cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:cursor-pointer" />
            <div class="text-[0.65rem] font-mono text-ink-faint truncate">{vtiArtifacts[selectedStepIndex]?.path}</div>
          </div>
        {:else}
          <div class="text-xs text-ink-faint">No timestep files detected yet.</div>
        {/if}
      </div>

      <!-- Artifacts list -->
      <div class="space-y-2">
        <h3 class="text-xs font-display font-bold text-ink">Artifacts</h3>
        <div class="space-y-1.5">
          {#each artifacts.filter(keepArtifact) as item}
            <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-surface-3">
              <span class="text-xs font-mono text-ink truncate">{item.path}</span>
              <span class="text-[0.65rem] text-ink-faint font-mono whitespace-nowrap">{item.size}B</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- stdout -->
      <div class="space-y-2">
        <h3 class="text-xs font-display font-bold text-ink">stdout</h3>
        <CodeBlock code={run.stdout_tail || ""} language="text" label="stdout tail" />
      </div>
    {/if}
  </section>

  <!-- Right: visualization -->
  <section class="rounded-xl border border-border bg-surface-2 p-4 space-y-3 min-h-0">
    <div>
      <h2 class="text-sm font-display font-bold text-ink">Inspection</h2>
      <p class="mt-0.5 text-xs text-ink-faint">Artifact selection, metadata, and helper output without an in-app renderer.</p>
    </div>

    <div class="rounded-xl border border-border bg-surface-3/70 min-h-[520px] p-4 flex flex-col gap-4">
      {#if selectedArtifact}
        <div class="rounded-lg border border-border bg-surface-0 p-4 space-y-2">
          <div class="text-[0.65rem] font-bold uppercase tracking-wider text-ink-faint">Selected timestep</div>
          <div class="text-sm font-mono text-ink break-all">{selectedArtifact.path}</div>
          <div class="text-xs text-ink-faint">Size: {selectedArtifact.size}B</div>
          {#if selectedArtifact.url}
            <a
              class="inline-flex items-center rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition-colors"
              href={selectedArtifact.url}
              target="_blank"
              rel="noreferrer">
              Open Artifact
            </a>
          {/if}
        </div>
      {:else}
        <div class="rounded-lg border border-dashed border-border bg-surface-0/70 p-4 text-sm text-ink-faint">
          No timestep artifact selected.
        </div>
      {/if}

      <div class="rounded-lg border border-border bg-surface-0 p-4 space-y-2">
        <div class="text-[0.65rem] font-bold uppercase tracking-wider text-ink-faint">Geometry artifacts</div>
        {#if geometryArtifacts.length}
          <div class="space-y-2">
            {#each geometryArtifacts as item}
              <div class="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-3 px-3 py-2">
                <div class="min-w-0">
                  <div class="text-xs font-mono text-ink truncate">{item.path}</div>
                  <div class="text-[0.65rem] text-ink-faint">{item.size}B</div>
                </div>
                <a
                  class="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-[0.7rem] font-semibold text-accent hover:bg-accent/20 transition-colors"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer">
                  Open
                </a>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-xs text-ink-faint">No geometry artifacts detected.</div>
        {/if}
      </div>

      <div class="rounded-lg border border-border bg-warn/5 px-4 py-3 text-xs text-warn/80">
        In-app 3D/post-processing is currently disabled. Open saved artifacts externally or add a new renderer later.
      </div>
    </div>
  </section>
</div>
