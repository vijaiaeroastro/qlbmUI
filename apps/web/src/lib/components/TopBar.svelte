<script>
  export let currentView = "connect";
  export let helperAddress = "";
  export let helperConnected = false;
  export let connectionNotice = "";
</script>

<header class="h-12 border-b border-border bg-surface-1 flex items-center justify-between px-4">
  <div class="flex items-center gap-3">
    <h1 class="text-base font-display font-bold text-ink">qlbm<span class="text-accent">UI</span></h1>
    <span class="text-xs text-ink-faint">Scientific Workstation</span>
  </div>

  <div class="flex items-center gap-2">
    <span class="inline-flex items-center gap-1.5 text-[0.65rem] font-bold px-2 py-1 rounded-lg
      {helperConnected ? 'text-good bg-good-glow' : 'text-bad bg-bad-glow'}">
      {helperConnected ? "Connected" : "Disconnected"}
    </span>
    {#if connectionNotice}
      <span class="text-[0.65rem] text-ink-faint">{connectionNotice}</span>
    {/if}
  </div>
</header>
