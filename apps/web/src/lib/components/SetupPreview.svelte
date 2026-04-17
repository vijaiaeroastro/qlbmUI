<script>
  export let caseData;

  function objectStyle(item) {
    const left = `${Math.max(0, item.position.x * 8)}px`;
    const top = `${Math.max(0, item.position.y * 8)}px`;
    const width = `${Math.max(18, (item.size.width ?? item.size.radius * 2 ?? 2) * 16)}px`;
    const height = `${Math.max(18, (item.size.height ?? item.size.radius * 2 ?? 2) * 16)}px`;
    return `left:${left};top:${top};width:${width};height:${height};`;
  }
</script>

<div class="relative min-h-[460px] rounded-xl border border-border overflow-hidden"
  style="background: linear-gradient(180deg, #0f1319 0%, #151a22 100%);">
  <!-- Grid pattern -->
  <div class="absolute inset-3 rounded-lg overflow-hidden border border-border"
    style="background-image: linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px); background-size: 28px 28px;">
    {#each caseData.objects as item}
      <div
        class="absolute border-2 border-accent/60 bg-accent/10 {item.type === 'sphere' ? 'rounded-full' : 'rounded-md'}"
        style={objectStyle(item)}></div>
    {/each}
  </div>

  <!-- Overlay cards -->
  <div class="absolute left-3 right-3 bottom-3 flex justify-between gap-3 pointer-events-none">
    <div class="rounded-lg border border-border bg-surface-2/95 backdrop-blur-sm p-2.5 max-w-[280px]">
      <strong class="text-xs text-ink">{caseData.name}</strong>
      <div class="text-[0.65rem] text-ink-faint mt-0.5">{caseData.dimension} / {caseData.latticeFamily} / {caseData.latticeModel}</div>
      <div class="text-[0.65rem] font-mono text-ink-muted mt-0.5">Grid {caseData.grid.x} x {caseData.grid.y}{caseData.dimension === "3D" ? ` x ${caseData.grid.z}` : ""}</div>
    </div>
    <div class="rounded-lg border border-border bg-surface-2/95 backdrop-blur-sm p-2.5 max-w-[240px]">
      <strong class="text-xs text-ink">Preview</strong>
      <div class="text-[0.65rem] text-ink-faint mt-0.5">Temporary 2D preview. vtk.js scene will replace this.</div>
    </div>
  </div>
</div>
