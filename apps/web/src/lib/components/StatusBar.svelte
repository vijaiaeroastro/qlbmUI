<script>
  export let helperAddress = "";
  export let helperConnected = false;
  export let currentRun = null;
  export let selectedStepIndex = 0;
  export let timestepCount = 0;
  export let currentView = "connect";
</script>

<footer class="h-7 flex-shrink-0 border-t border-border bg-surface-1 flex items-center justify-between px-3 text-[0.6rem] font-mono">
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-1.5">
      <span class="w-1.5 h-1.5 rounded-full {helperConnected ? 'bg-good animate-pulse-dot' : 'bg-bad'}"></span>
      <span class="font-semibold text-ink-muted">{helperConnected ? "Connected" : "Disconnected"}</span>
    </div>
    {#if helperAddress}
      <span class="text-ink-faint">{helperAddress}</span>
    {/if}
  </div>

  <div class="flex items-center gap-3 text-ink-faint">
    <span>{currentView}</span>
    <span class="text-border">|</span>
    <span>Run: <span class="text-ink-muted">{currentRun?.run_id || "-"}</span></span>
    {#if currentRun}
      <span class="w-1 h-1 rounded-full {currentRun.status === 'completed' ? 'bg-good' : currentRun.status === 'failed' ? 'bg-bad' : 'bg-warn'}"></span>
    {/if}
    <span class="text-border">|</span>
    <span>Step: <span class="text-ink-muted">{timestepCount ? `${selectedStepIndex + 1}/${timestepCount}` : "-"}</span></span>
  </div>
</footer>
