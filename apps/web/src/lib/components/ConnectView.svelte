<script>
  export let connectionCode = "";
  export let manualAddress = "http://127.0.0.1:8712";
  export let decodedAddress = "";
  export let errorMessage = "";
  export let onConnectionCodeInput;
  export let onManualAddressInput;
  export let onDecode;
  export let onConnect;
</script>

<div class="grid grid-cols-1 lg:grid-cols-[minmax(300px,380px)_1fr] gap-4">
  <section class="rounded-xl border border-border bg-surface-2 p-4 space-y-4">
    <div>
      <h2 class="text-sm font-display font-bold text-ink">Connect Local Helper</h2>
      <p class="mt-1 text-xs text-ink-faint leading-relaxed">
        Start the Python helper locally, copy the connection code from its terminal output,
        and paste it here.
      </p>
    </div>

    <div class="space-y-1.5">
      <label for="connection-code" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Connection code</label>
      <textarea
        id="connection-code"
        class="w-full h-24 px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono placeholder:text-ink-faint/60 focus:outline-none focus:border-accent/40 resize-none transition-colors"
        placeholder="Paste the helper connection code"
        value={connectionCode}
        on:input={onConnectionCodeInput}></textarea>
    </div>

    <div class="flex gap-2">
      <button
        class="px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink transition-colors cursor-pointer"
        on:click={onDecode}>
        Decode
      </button>
      <button
        class="px-3.5 py-2 text-xs font-bold rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
        on:click={onConnect}>
        Connect
      </button>
    </div>

    <div class="space-y-1.5">
      <label for="manual-address" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Manual helper address</label>
      <input
        id="manual-address"
        class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono placeholder:text-ink-faint/60 focus:outline-none focus:border-accent/40 transition-colors"
        placeholder="http://127.0.0.1:8712"
        value={manualAddress}
        on:input={onManualAddressInput} />
    </div>

    {#if decodedAddress}
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-good/20 bg-good-glow">
        <span class="w-1.5 h-1.5 rounded-full bg-good"></span>
        <span class="text-sm text-good font-mono">{decodedAddress}</span>
      </div>
    {/if}

    {#if errorMessage}
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-bad/20 bg-bad-glow">
        <span class="w-1.5 h-1.5 rounded-full bg-bad"></span>
        <span class="text-sm text-bad">{errorMessage}</span>
      </div>
    {/if}
  </section>

  <section class="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
    <div>
      <h2 class="text-sm font-display font-bold text-ink">Helper Workflow</h2>
      <p class="mt-1 text-xs text-ink-faint leading-relaxed">
        The web app stays client-side. It only talks to the local helper over HTTP.
      </p>
    </div>

    <div class="rounded-lg bg-surface-0 border border-border p-3 font-mono text-xs text-ink-muted leading-relaxed">1. Launch qlbm-local-helper
2. Copy the printed connection code
3. Paste it here
4. Browse saved runs or create a new setup
5. Run locally and inspect results later with vtk.js</div>
  </section>
</div>
