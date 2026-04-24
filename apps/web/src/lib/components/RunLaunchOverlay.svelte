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
  $: stageLabel = state?.stage ? String(state.stage).replace(/-/g, " ") : "running";
  $: stderrLabel = state?.status === "failed" ? "Latest Failure Detail" : "Latest stderr";
  $: stderrToneClass = state?.status === "failed"
    ? "border-bad/30 bg-[#35191f] text-[#ffd5db]"
    : "border-white/8 bg-white/5 text-slate-200";
  $: stderrHeadingClass = state?.status === "failed" ? "text-[#f4a2ad]" : "text-slate-500";
</script>

<div class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/24 px-4 backdrop-blur-[3px]">
  <div class="w-[min(680px,calc(100vw-2rem))]">
    <div class="overflow-hidden rounded-[24px] border border-border-strong bg-surface-1 shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
      <div class="border-b border-border bg-[linear-gradient(135deg,rgba(11,141,184,0.12),rgba(255,255,255,0.96)_46%,rgba(10,123,98,0.10))] px-5 py-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="text-[0.66rem] font-mono font-bold uppercase tracking-[0.22em] text-accent-strong">Local Run</div>
            <h2 class="mt-2 text-xl font-display font-bold text-ink">Launching Case</h2>
            <p class="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
              The local helper is preparing and running this case. Results will open automatically when the run settles.
            </p>
          </div>

          <div class="shrink-0 rounded-2xl border border-accent/20 bg-white/80 px-3 py-2 text-right shadow-sm">
            <div class="text-[0.58rem] font-mono font-bold uppercase tracking-[0.18em] text-ink-faint">Stage</div>
            <div class="mt-1 text-sm font-semibold capitalize text-accent-strong">{stageLabel}</div>
          </div>
        </div>
      </div>

      <div class="space-y-4 px-5 py-4">
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_152px]">
          <div class="rounded-2xl border border-border bg-surface-2 px-4 py-3">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="text-[0.62rem] font-mono font-bold uppercase tracking-[0.18em] text-ink-faint">Status</div>
                <div class="mt-1 text-sm font-semibold text-ink">{state.message}</div>
              </div>
              <div class="text-right">
                <div class="text-[0.62rem] font-mono font-bold uppercase tracking-[0.18em] text-ink-faint">Progress</div>
                <div class="mt-1 text-sm font-mono text-ink">{progressPercent}%</div>
              </div>
            </div>

            <div class="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-4">
              <div
                class="h-full rounded-full bg-[linear-gradient(90deg,#0b8db8_0%,#0a7b62_100%)] transition-all duration-300"
                style={`width: ${progressPercent}%`}></div>
            </div>
          </div>

          <div class="rounded-2xl border border-border bg-surface-2 px-4 py-3">
            <div class="text-[0.62rem] font-mono font-bold uppercase tracking-[0.18em] text-ink-faint">Run ID</div>
            <div class="mt-1 break-all text-sm font-mono text-ink">{state.runId}</div>
          </div>
        </div>

        {#if latestStdout || latestStderr}
          <div class="rounded-2xl border border-border bg-[#0f1720] px-4 py-3 text-slate-100 shadow-inner">
            <div class="flex items-center justify-between gap-3">
              <div class="text-[0.62rem] font-mono font-bold uppercase tracking-[0.18em] text-slate-400">Runtime Log</div>
              <div class="inline-flex items-center gap-2 text-[0.68rem] font-mono text-slate-400">
                <span class="h-2 w-2 rounded-full bg-good"></span>
                live
              </div>
            </div>

            {#if latestStdout}
              <div class="mt-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                <div class="text-[0.58rem] font-mono font-bold uppercase tracking-[0.16em] text-slate-500">Latest Output</div>
                <p class="mt-1.5 text-sm text-slate-200">{latestStdout}</p>
              </div>
            {/if}

            {#if latestStderr}
              <div class={`mt-3 rounded-xl border px-3 py-2 ${stderrToneClass}`}>
                <div class={`text-[0.58rem] font-mono font-bold uppercase tracking-[0.16em] ${stderrHeadingClass}`}>{stderrLabel}</div>
                <p class="mt-1.5 text-sm">{latestStderr}</p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
