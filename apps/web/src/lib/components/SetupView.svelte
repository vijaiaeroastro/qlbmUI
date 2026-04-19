<script>
  import QlbmEmbeddedViewer from "./QlbmEmbeddedViewer.svelte";
  import CodeBlock from "./CodeBlock.svelte";

  export let caseData;
  export let selectedTab = "preview";
  export let generatedScript = "";
  export let onBack;
  export let onChangeTab;
  export let onSubmit;

  const tabs = [
    { id: "preview", label: "Preview" },
    { id: "case", label: "Case JSON" },
    { id: "script", label: "Python" }
  ];
</script>

<div class="h-full flex flex-col gap-3 animate-fade-in min-h-0">
  <div class="flex flex-wrap items-center justify-between gap-2 shrink-0">
    <div class="flex flex-wrap items-center gap-2">
      <button
        class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink hover:border-border-hover transition-colors cursor-pointer"
        on:click={onBack}>
        ← Runs
      </button>
      <div class="h-5 w-px bg-border"></div>
      <span class="text-xs font-display font-bold text-ink">{caseData.name || "Untitled case"}</span>
      <span class="px-2 py-0.5 text-[0.6rem] font-mono font-bold uppercase tracking-widest rounded-full border border-border bg-surface-3 text-ink-faint">
        {caseData.dimension} · {caseData.grid.x}×{caseData.grid.y}{caseData.dimension === "3D" ? `×${caseData.grid.z}` : ""}
      </span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-1 py-1">
        {#each tabs as tab}
          <button
            class="px-2.5 py-1 text-[0.7rem] font-semibold rounded-md border transition-all cursor-pointer
              {selectedTab === tab.id
                ? 'border-accent/30 bg-accent/10 text-accent'
                : 'border-transparent bg-transparent text-ink-faint hover:text-ink-muted'}"
            on:click={() => onChangeTab(tab.id)}>
            {tab.label}
          </button>
        {/each}
      </div>
      <button
        class="px-4 py-1.5 text-xs font-bold rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
        on:click={onSubmit}>
        Run Locally ▶
      </button>
    </div>
  </div>

  <div class="flex-1 min-h-0 rounded-xl border border-border bg-surface-2 overflow-hidden flex flex-col">
    <div class="flex-1 min-h-0 overflow-hidden p-3">
      <div class:hidden={selectedTab !== "preview"} class="h-full">
        <QlbmEmbeddedViewer {caseData} />
      </div>
      {#if selectedTab === "case"}
        <CodeBlock code={JSON.stringify(caseData, null, 2)} language="json" label="Case JSON" fillHeight={true} />
      {:else if selectedTab === "script"}
        <CodeBlock code={generatedScript} language="python" label="Generated Python" fillHeight={true} />
      {/if}
    </div>
  </div>
</div>
