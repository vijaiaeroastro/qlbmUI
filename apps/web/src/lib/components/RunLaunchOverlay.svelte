<script>
  export let state;

  function lastMeaningfulLine(text) {
    if (!text) {
      return "";
    }

    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-1)[0] || "";
  }

  $: latestStdout = lastMeaningfulLine(state?.stdoutTail);
  $: latestStderr = lastMeaningfulLine(state?.stderrTail);
  $: progressPercent = Math.max(0, Math.min(100, Number(state?.percent ?? 0)));
</script>

<div class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/28 px-4 backdrop-blur-sm">
  <div class="w-full max-w-xl rounded-[28px] border border-border bg-surface-0/98 shadow-panel">
    <div class="border-b border-border bg-gradient-to-br from-accent/10 via-surface-0 to-good/10 px-6 py-5">
      <div class="text-[0.68rem] font-mono font-bold uppercase tracking-[0.2em] text-accent-strong">Local Run</div>
      <h2 class="mt-2 text-2xl font-display font-bold text-ink">Launching Case</h2>
      <p class="mt-2 text-sm leading-relaxed text-ink-muted">
        The local helper is preparing and running this case. Results will open automatically when the run settles.
      </p>
    </div>

    <div class="space-y-5 px-6 py-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="rounded-2xl border border-border bg-surface-2 px-3 py-2">
          <div class="text-[0.62rem] font-mono font-bold uppercase tracking-[0.18em] text-ink-faint">Run ID</div>
          <div class="mt-1 text-sm font-mono text-ink">{state.runId}</div>
        </div>
        <div class="rounded-2xl border border-border bg-surface-2 px-3 py-2 text-right">
          <div class="text-[0.62rem] font-mono font-bold uppercase tracking-[0.18em] text-ink-faint">Stage</div>
          <div class="mt-1 text-sm font-semibold capitalize text-accent-strong">{state.stage}</div>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-3">
          <span class="text-sm font-semibold text-ink">{state.message}</span>
          <span class="text-sm font-mono text-ink-faint">{progressPercent}%</span>
        </div>
        <div class="h-3 overflow-hidden rounded-full border border-border bg-surface-2">
          <div
            class="h-full rounded-full bg-gradient-to-r from-accent to-good transition-all duration-300"
            style={`width: ${progressPercent}%`}></div>
        </div>
      </div>

      {#if latestStdout}
        <div class="rounded-2xl border border-border bg-surface-2 px-4 py-3">
          <div class="text-[0.62rem] font-mono font-bold uppercase tracking-[0.18em] text-ink-faint">Latest Output</div>
          <p class="mt-2 text-sm text-ink-muted">{latestStdout}</p>
        </div>
      {/if}

      {#if latestStderr}
        <div class="rounded-2xl border border-bad/25 bg-bad-glow px-4 py-3">
          <div class="text-[0.62rem] font-mono font-bold uppercase tracking-[0.18em] text-bad">Latest Error</div>
          <p class="mt-2 text-sm text-bad">{latestStderr}</p>
        </div>
      {/if}
    </div>
  </div>
</div>
