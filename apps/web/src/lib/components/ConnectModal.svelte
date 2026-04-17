<script>
  export let connectionCode = "";
  export let manualAddress = "http://127.0.0.1:8712";
  export let decodedAddress = "";
  export let errorMessage = "";
  export let canClose = false;
  export let onConnectionCodeInput;
  export let onManualAddressInput;
  export let onDecode;
  export let onConnect;
  export let onClose;
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
  <div class="w-full max-w-lg bg-surface-2 border border-border rounded-2xl shadow-panel overflow-hidden animate-slide-up">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 p-5 pb-0">
      <div>
        <h2 class="text-lg font-display font-bold text-ink">Connect Local Helper</h2>
        <p class="mt-1 text-sm text-ink-muted leading-relaxed">
          Paste the connection code from the helper terminal, or enter an address manually.
        </p>
      </div>
      <button
        class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink hover:border-border-hover transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        disabled={!canClose}
        on:click={onClose}>
        Close
      </button>
    </div>

    <div class="p-5 space-y-4">
      <!-- Connection code -->
      <div class="space-y-1.5">
        <label for="connection-code" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
          Connection code
        </label>
        <textarea
          id="connection-code"
          class="w-full h-24 px-3 py-2.5 rounded-xl border border-border bg-surface-0 text-sm text-ink font-mono placeholder:text-ink-faint/60 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 resize-none transition-colors"
          placeholder="Paste helper connection code"
          value={connectionCode}
          on:input={onConnectionCodeInput}></textarea>
      </div>

      <div class="flex gap-2">
        <button
          class="px-4 py-2 text-xs font-bold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink hover:border-border-hover transition-colors cursor-pointer"
          on:click={onDecode}>
          Decode
        </button>
        <button
          class="px-4 py-2 text-xs font-bold rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
          on:click={onConnect}>
          Connect
        </button>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-3">
        <div class="flex-1 h-px bg-border"></div>
        <span class="text-[0.65rem] uppercase tracking-widest text-ink-faint">or</span>
        <div class="flex-1 h-px bg-border"></div>
      </div>

      <!-- Manual address -->
      <div class="space-y-1.5">
        <label for="manual-address" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
          Manual helper address
        </label>
        <input
          id="manual-address"
          class="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-0 text-sm text-ink font-mono placeholder:text-ink-faint/60 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
          placeholder="http://127.0.0.1:8712"
          value={manualAddress}
          on:input={onManualAddressInput} />
      </div>

      <!-- Status messages -->
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
    </div>
  </div>
</div>
