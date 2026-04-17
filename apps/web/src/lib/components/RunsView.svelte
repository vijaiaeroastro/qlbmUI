<script>
  export let runs = [];
  export let selectedRunIds = [];
  export let onRefresh;
  export let onNewProject;
  export let onOpenRun;
  export let onToggleRun;
  export let onDeleteRun;
  export let onDeleteSelected;
  export let onDeleteAll;

  function isSelected(runId) {
    return selectedRunIds.includes(runId);
  }

  $: allSelected = runs.length > 0 && selectedRunIds.length === runs.length;
  $: selectedSingleRun = selectedRunIds.length === 1 ? runs.find((run) => run.run_id === selectedRunIds[0]) : null;

  function toggleAll(event) {
    const checked = event.currentTarget.checked;
    if (checked) {
      for (const run of runs) {
        if (!isSelected(run.run_id)) {
          onToggleRun(run.run_id);
        }
      }
      return;
    }
    for (const run of runs) {
      if (isSelected(run.run_id)) {
        onToggleRun(run.run_id);
      }
    }
  }
</script>

<div class="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 animate-fade-in">
  <!-- Main list area -->
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3 p-4 rounded-[22px] border border-border bg-surface-1 shadow-panel">
      <div>
        <div class="text-[0.7rem] font-mono uppercase tracking-[0.16em] text-ink-faint">Run Queue</div>
        <h2 class="mt-2 text-xl font-display font-bold text-ink">Local runs</h2>
        <p class="mt-1 text-sm text-ink-muted">Dispatch new cases, inspect run status, and reopen existing outputs.</p>
      </div>
      <div class="flex gap-2 flex-wrap justify-end">
        <button
          class="px-4 py-2.5 text-sm font-bold rounded-xl border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
          on:click={onNewProject}>
          New Project
        </button>
        <button
          class="px-4 py-2.5 text-sm font-semibold rounded-xl border border-border bg-surface-2 text-ink-muted hover:text-ink hover:border-border-hover transition-colors cursor-pointer"
          on:click={onRefresh}>
          Refresh
        </button>
        <button
          class="px-4 py-2.5 text-sm font-semibold rounded-xl border border-border bg-surface-2 text-ink-muted hover:text-ink hover:border-border-hover transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!selectedRunIds.length}
          on:click={onDeleteSelected}>
          Delete Selected
        </button>
        <button
          class="px-4 py-2.5 text-sm font-semibold rounded-xl border border-bad/20 bg-bad-glow text-bad hover:bg-bad/15 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!runs.length}
          on:click={onDeleteAll}>
          Delete All
        </button>
      </div>
    </div>

    <!-- Runs panel -->
    <div class="rounded-[22px] border border-border bg-surface-1 shadow-panel p-5 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-display font-bold text-ink">Runs</h3>
          <p class="mt-1 text-sm text-ink-muted">Each run stores the generated case, logs, and helper artifacts.</p>
        </div>
        <label class="flex items-center gap-2 text-xs text-ink-faint cursor-pointer">
          <input type="checkbox" checked={allSelected} on:change={toggleAll} class="rounded" />
          Select all
        </label>
      </div>

      <div class="space-y-3">
        {#if !runs.length}
          <div class="flex items-center justify-center py-12 rounded-[20px] border border-dashed border-border text-sm text-ink-faint bg-surface-2">
            No runs found. Start a new project.
          </div>
        {/if}

        {#each runs as run}
          <article
            class="group flex items-start justify-between gap-4 p-4 rounded-[20px] border transition-all
              {isSelected(run.run_id)
                ? 'border-accent/20 bg-accent-glow shadow-glow'
                : 'border-border bg-surface-2 hover:border-border-hover'}">
            <div class="flex items-start gap-3">
              <div class="pt-0.5">
                <input
                  type="checkbox"
                  checked={isSelected(run.run_id)}
                  on:change={() => onToggleRun(run.run_id)}
                  class="rounded cursor-pointer" />
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-mono font-bold text-ink px-2 py-1 rounded-xl bg-white border border-border">
                    {run.case_name || run.run_id}
                  </span>
                  <span class="inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wider px-2 py-1 rounded-xl
                    {run.status === 'completed' ? 'text-good bg-good-glow' : run.status === 'failed' ? 'text-bad bg-bad-glow' : 'text-warn bg-warn/10'}">
                    <span class="w-1 h-1 rounded-full
                      {run.status === 'completed' ? 'bg-good' : run.status === 'failed' ? 'bg-bad' : 'bg-warn animate-pulse-dot'}"></span>
                    {run.status}
                  </span>
                </div>
                <div class="flex gap-4 flex-wrap text-xs text-ink-faint">
                  <span><span class="text-ink-faint/70">Run ID</span> <code class="font-mono text-ink-muted">{run.run_id}</code></span>
                  <span>{new Date((run.created_at || 0) * 1000).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
              <button
                class="px-3 py-2 text-xs font-bold rounded-xl border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
                on:click={() => onOpenRun(run.run_id)}>
                Open
              </button>
              <button
                class="px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-surface-3 text-ink-faint hover:text-ink-muted transition-colors cursor-pointer"
                on:click={() => onDeleteRun(run.run_id)}>
                Delete
              </button>
            </div>
          </article>
        {/each}
      </div>
    </div>
  </div>

  <!-- Context sidebar -->
  <aside class="rounded-[22px] border border-border bg-surface-1 shadow-panel p-5 space-y-4">
    <div>
      <div class="text-[0.7rem] font-mono uppercase tracking-[0.16em] text-ink-faint">Inspector</div>
      <h2 class="mt-2 text-lg font-display font-bold text-ink">Run details</h2>
      <p class="mt-1 text-sm text-ink-muted leading-relaxed">Select a single run to inspect metadata before opening results.</p>
    </div>

    <div class="h-px bg-border"></div>

    {#if selectedSingleRun}
      <div class="space-y-3 animate-fade-in">
        <div class="space-y-2">
          {#each [
            ["Target", selectedSingleRun.run_id],
            ["Status", selectedSingleRun.status],
            ["Created", new Date((selectedSingleRun.created_at || 0) * 1000).toLocaleString()]
          ] as [label, value]}
            <div class="flex items-center justify-between gap-3 pb-3 border-b border-border/50">
              <span class="text-xs text-ink-faint">{label}</span>
              <span class="text-sm font-mono text-ink-muted text-right">{value}</span>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-center py-12 rounded-[20px] border border-dashed border-border text-sm text-ink-faint bg-surface-2">
        Select a single run to view details.
      </div>
    {/if}
  </aside>
</div>
