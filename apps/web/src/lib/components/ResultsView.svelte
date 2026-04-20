<script>
  import CodeBlock from "./CodeBlock.svelte";
  import ResultsEmbeddedViewer from "./ResultsEmbeddedViewer.svelte";

  export let run = null;
  export let vtiArtifacts = [];
  export let geometryArtifacts = [];
  export let selectedStepIndex = 0;
  export let isPlaying = false;
  export let onBack;
  export let onRefresh;
  export let onSelectStep;
  export let onTogglePlayback;
  export let onStepDelta;

  $: selectedArtifact = vtiArtifacts[selectedStepIndex] || null;
  $: timestepCount = vtiArtifacts.length;
  $: obstacleCount = geometryArtifacts.length;
  $: resultsDimension = run?.case_data?.dimension || run?.case?.dimension || null;
</script>

<div class="grid h-full min-h-0 grid-cols-1 gap-4 animate-fade-in lg:grid-cols-[minmax(300px,360px)_1fr]">
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

      <!-- Dataset summary -->
      <div class="space-y-2">
        <h3 class="text-xs font-display font-bold text-ink">Dataset</h3>
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-lg border border-border bg-surface-3 p-3">
            <span class="block text-[0.6rem] font-bold uppercase tracking-widest text-ink-faint mb-1">Timesteps</span>
            <strong class="text-base font-mono text-ink">{timestepCount}</strong>
          </div>
          <div class="rounded-lg border border-border bg-surface-3 p-3">
            <span class="block text-[0.6rem] font-bold uppercase tracking-widest text-ink-faint mb-1">Obstacles</span>
            <strong class="text-base font-mono text-ink">{obstacleCount}</strong>
          </div>
        </div>
        <p class="text-xs text-ink-faint">
          The viewer loads the active timestep together with the exported obstacle geometry.
        </p>
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

      <!-- stdout -->
      <div class="space-y-2">
        <h3 class="text-xs font-display font-bold text-ink">stdout</h3>
        <CodeBlock code={run.stdout_tail || ""} language="text" label="stdout tail" />
      </div>
    {/if}
  </section>

  <!-- Right: visualization -->
  <section class="rounded-xl border border-border bg-surface-2 p-4 space-y-3 min-h-0 flex flex-col">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-sm font-display font-bold text-ink">Post-processing</h2>
        <p class="mt-0.5 text-xs text-ink-faint">Active timestep `.vti` with obstacle `.stl` geometry layered into the same viewer.</p>
      </div>
      {#if selectedArtifact}
        <div class="rounded-lg border border-border bg-surface-3 px-3 py-2 text-right">
          <div class="text-[0.62rem] font-mono font-bold uppercase tracking-[0.16em] text-ink-faint">Active timestep</div>
          <div class="mt-1 text-xs font-mono text-ink">{selectedArtifact.path}</div>
        </div>
      {/if}
    </div>

    <div class="rounded-xl border border-border bg-surface-3/70 p-4 flex-1 min-h-[620px]">
      <div class="h-full w-full">
        <ResultsEmbeddedViewer
          {vtiArtifacts}
          {geometryArtifacts}
          {selectedStepIndex}
          {resultsDimension}
          theme="light" />
      </div>
    </div>
  </section>
</div>
