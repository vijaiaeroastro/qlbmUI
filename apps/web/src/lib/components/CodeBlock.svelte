<script>
  import { renderHighlightedCode } from "../domain/codeHighlight.js";

  export let code = "";
  export let language = "text";
  export let label = "";

  $: highlighted = renderHighlightedCode(code, language);
</script>

<div class="rounded-xl border border-border overflow-hidden bg-surface-0 relative scanlines">
  {#if label}
    <div class="flex items-center justify-between min-h-[34px] px-3 border-b border-border/60 bg-surface-1">
      <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-ink-faint">{label}</span>
    </div>
  {/if}
  <pre class="m-0 p-0 overflow-auto font-mono text-[0.8rem] leading-relaxed"><code class="language-{language}">{@html highlighted}</code></pre>
</div>

<style>
  pre :global(.code-block__line) {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
  }
  pre :global(.code-block__line:hover) {
    background: rgba(148, 163, 184, 0.04);
  }
  pre :global(.code-block__gutter),
  pre :global(.code-block__content) {
    white-space: pre;
    padding-top: 0.1rem;
    padding-bottom: 0.1rem;
  }
  pre :global(.code-block__gutter) {
    user-select: none;
    text-align: right;
    padding-left: 10px;
    padding-right: 10px;
    color: #3a4a5c;
    border-right: 1px solid rgba(148, 163, 184, 0.08);
    background: rgba(10, 14, 20, 0.4);
  }
  pre :global(.code-block__content) {
    display: block;
    padding-left: 12px;
    padding-right: 16px;
  }
  pre :global(.code-token.keyword) { color: #22d3ee; }
  pre :global(.code-token.string) { color: #34d399; }
  pre :global(.code-token.number) { color: #fbbf24; }
  pre :global(.code-token.comment) { color: #4a5568; font-style: italic; }
</style>
