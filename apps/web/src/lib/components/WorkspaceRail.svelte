<script>
  export let currentView = "runs";
  export let helperConnected = false;
  export let currentRun = null;
  export let onNavigate;

  const items = [
    { id: "runs", label: "Run Queue", hint: "Inspect and manage local runs", icon: "R" },
    { id: "setup", label: "Case Builder", hint: "Define the simulation setup", icon: "C" },
    { id: "results", label: "Results", hint: "Review logs and artifacts", icon: "V", requiresRun: true }
  ];
</script>

<aside class="w-56 flex-shrink-0 border-r border-border bg-surface-1/55 flex flex-col items-stretch py-5 px-4 gap-5">
  <!-- Brand -->
  <button
    class="group flex flex-col items-start gap-1 cursor-pointer bg-transparent border-0 p-1 text-left"
    on:click={() => onNavigate("runs")}>
    <span class="text-[0.62rem] font-mono uppercase tracking-[0.18em] text-ink-faint group-hover:text-ink-muted transition-colors">qlbm workstation</span>
    <span class="text-[1.55rem] font-display font-bold text-ink leading-none">UI</span>
  </button>

  <!-- Connection indicator -->
  <button
    class="w-full min-h-12 rounded-2xl flex items-center justify-start gap-3 px-3.5 border transition-all cursor-pointer text-left
      {helperConnected
        ? 'border-good/20 bg-good-glow text-good hover:border-good/40'
        : 'border-bad/20 bg-bad-glow text-bad hover:border-bad/40'}"
    on:click={() => onNavigate("connect")}
    title={helperConnected ? "Helper online" : "Helper offline"}>
    <span class="w-2.5 h-2.5 rounded-full animate-pulse-dot {helperConnected ? 'bg-good' : 'bg-bad'}"></span>
    <span class="min-w-0 flex flex-col">
      <span class="text-[0.66rem] font-semibold uppercase tracking-[0.14em]">{helperConnected ? "Connected" : "Connection"}</span>
      <span class="mt-0.5 text-[0.74rem] text-current/80">{helperConnected ? "Local helper online" : "Connect local helper"}</span>
    </span>
  </button>

  <!-- Divider -->
  <div class="w-full h-px bg-border"></div>

  <!-- Navigation -->
  <nav class="flex flex-col gap-2">
    {#each items as item}
      <button
        class="w-full rounded-2xl flex items-center gap-3 px-3 py-3 border transition-all text-left cursor-pointer
          {currentView === item.id
            ? 'border-accent/20 bg-accent-glow text-accent-strong shadow-glow'
            : 'border-transparent bg-transparent text-ink-faint hover:text-ink hover:bg-surface-3'}"
        disabled={item.requiresRun && !currentRun}
        class:opacity-30={item.requiresRun && !currentRun}
        class:cursor-not-allowed={item.requiresRun && !currentRun}
        on:click={() => onNavigate(item.id)}>
        <span class="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-3 border border-border text-sm font-mono font-bold shrink-0
          {currentView === item.id ? 'border-accent/20 bg-white text-accent-strong' : 'text-ink-muted'}">{item.icon}</span>
        <span class="min-w-0 flex flex-col">
          <span class="text-[0.83rem] font-semibold leading-none">{item.label}</span>
          <span class="mt-1 text-[0.68rem] leading-snug text-ink-faint normal-case tracking-normal">{item.hint}</span>
        </span>
      </button>
    {/each}
  </nav>
</aside>
