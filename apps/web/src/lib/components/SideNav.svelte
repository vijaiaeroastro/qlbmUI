<script>
  export let currentView = "connect";
  export let helperConnected = false;
  export let connectModalOpen = false;
  export let onNavigate;

  const items = [
    { id: "connect", label: "Connect", glyph: "C" },
    { id: "runs", label: "Runs", glyph: "R" },
    { id: "setup", label: "Setup", glyph: "S" },
    { id: "results", label: "Results", glyph: "V" }
  ];
</script>

<aside class="w-16 bg-surface-1 border-r border-border flex flex-col items-center py-4 gap-4">
  <div class="text-center">
    <div class="text-sm font-display font-bold text-accent">UI</div>
    <div class="text-[0.55rem] text-ink-faint uppercase tracking-widest">qlbm</div>
  </div>

  <span class="inline-flex items-center justify-center w-8 h-8 rounded-full text-[0.6rem] font-bold
    {helperConnected ? 'text-good bg-good-glow' : 'text-bad bg-bad-glow'}">
    <span class="w-2 h-2 rounded-full {helperConnected ? 'bg-good' : 'bg-bad'}"></span>
  </span>

  <nav class="flex flex-col gap-2">
    {#each items as item}
      <button
        class="w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[0.55rem] font-bold cursor-pointer border transition-all
          {(item.id === 'connect' ? connectModalOpen : currentView === item.id)
            ? 'border-accent/30 bg-accent/10 text-accent'
            : 'border-transparent text-ink-faint hover:text-ink-muted hover:bg-surface-3'}"
        on:click={() => onNavigate(item.id)}>
        <span class="font-mono text-xs">{item.glyph}</span>
      </button>
    {/each}
  </nav>
</aside>
