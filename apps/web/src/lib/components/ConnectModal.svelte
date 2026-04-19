<script>
  export let step = "welcome";
  export let connectionCode = "";
  export let manualAddress = "http://127.0.0.1:8712";
  export let decodedAddress = "";
  export let errorMessage = "";
  export let canClose = false;
  export let onChooseExistingHelper;
  export let onChooseInstallHelper;
  export let onBackToWelcome;
  export let onConnectionCodeInput;
  export let onManualAddressInput;
  export let onDecode;
  export let onConnect;
  export let onClose;
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
  <div class="w-full max-w-2xl bg-surface-1 border border-border rounded-[28px] shadow-panel overflow-hidden animate-slide-up">
    <!-- Header -->
    <div class="relative overflow-hidden border-b border-border bg-gradient-to-br from-accent/10 via-surface-1 to-surface-2">
      <div class="absolute inset-0 opacity-60" style="background: radial-gradient(circle at top right, rgba(11,141,184,0.16), transparent 32%), radial-gradient(circle at left center, rgba(10,123,98,0.10), transparent 28%);"></div>
      <div class="relative flex items-start justify-between gap-4 p-6 pb-5">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/15 bg-white/70 text-[0.68rem] font-mono uppercase tracking-[0.16em] text-accent-strong">
          <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
          Local Runtime
        </div>
        <h2 class="mt-4 text-2xl font-display font-bold text-ink">
          {step === "welcome" ? "Set Up Local Helper" : step === "install" ? "Install the Local Helper" : "Connect Local Helper"}
        </h2>
        <p class="mt-2 text-sm text-ink-muted leading-relaxed max-w-2xl">
          {#if step === "welcome"}
            qlbmUI runs simulations through a small local helper service. We can either connect to one you already have or help you install it.
          {:else if step === "install"}
            Install the helper once on this machine, then start it and return here to connect.
          {:else}
            Paste the connection code from the helper terminal, or enter an address manually.
          {/if}
        </p>
      </div>
      <button
        class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink hover:border-border-hover transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        disabled={!canClose}
        on:click={onClose}>
        Close
      </button>
      </div>
    </div>

    <div class="p-6 space-y-5 bg-gradient-to-b from-surface-1 to-surface-2/60">
      {#if step === "welcome"}
        <div class="rounded-[26px] border border-border bg-white/75 p-4 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            class="text-left rounded-[24px] border-2 border-black bg-gradient-to-br from-accent/10 to-white hover:border-accent-strong hover:from-accent/15 hover:to-surface-1 hover:-translate-y-0.5 transition-all p-5 cursor-pointer shadow-glow"
            on:click={onChooseExistingHelper}>
            <div class="flex flex-col items-start gap-3">
              <div class="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-accent/15 text-accent-strong font-mono font-bold">
                GO
              </div>
              <span class="text-[0.68rem] font-mono uppercase tracking-[0.16em] text-accent-strong">Existing helper</span>
            </div>
            <div class="mt-4 text-base font-display font-bold text-ink">I already have it</div>
            <p class="mt-2 text-sm text-ink-muted leading-relaxed">
              Connect to a helper already running on this machine or another reachable address.
            </p>
          </button>

          <button
            class="text-left rounded-[24px] border-2 border-black bg-gradient-to-br from-white to-surface-1 hover:border-accent-strong hover:to-surface-2 hover:-translate-y-0.5 transition-all p-5 cursor-pointer"
            on:click={onChooseInstallHelper}>
            <div class="flex flex-col items-start gap-3">
              <div class="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-warn/10 border border-warn/15 text-warn font-mono font-bold">
                NEW
              </div>
              <span class="text-[0.68rem] font-mono uppercase tracking-[0.16em] text-ink-faint">First-time setup</span>
            </div>
            <div class="mt-4 text-base font-display font-bold text-ink">No, help me install it</div>
            <p class="mt-2 text-sm text-ink-muted leading-relaxed">
              Show the install and startup steps for the local helper so I can run qlbmUI on this machine.
            </p>
          </button>
        </div>
        </div>

        <div class="rounded-[22px] border-2 border-black bg-white/80 px-5 py-4 shadow-sm">
          <div class="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
            <span class="w-2 h-2 rounded-full bg-accent"></span>
            Expected default
          </div>
          <div class="mt-2 text-sm text-ink-muted">
            We try
            <span class="inline-flex items-center px-2 py-0.5 mx-1 rounded-lg border border-border bg-surface-2 font-mono text-[0.82em] text-ink">
              http://127.0.0.1:8712
            </span>
            automatically on startup. If nothing is there, you will need to install or start the helper first.
          </div>
        </div>
      {:else if step === "install"}
        <div class="rounded-[26px] border-2 border-black bg-white/80 p-5 shadow-sm overflow-hidden">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/15 bg-accent/10 text-[0.68rem] font-mono uppercase tracking-[0.16em] text-accent-strong">
                <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
                Python required
              </div>
              <h3 class="mt-4 text-xl font-display font-bold text-ink">Install the helper</h3>
              <p class="mt-2 text-sm text-ink-muted leading-relaxed">
                Download the installer, run it once, then launch the generated helper script.
              </p>
            </div>
            <a
              href="/downloads/qlbmLocalHelperInstaller.py"
              download
              class="shrink-0 inline-flex items-center px-4 py-2.5 rounded-xl border border-accent/20 bg-accent/10 text-sm font-bold text-accent hover:bg-accent/20 transition-colors">
              Download installer
            </a>
          </div>

          <div class="mt-5 grid gap-3">
            <div class="rounded-[20px] border border-border bg-white/85 p-4 shadow-sm">
              <div class="text-[0.72rem] font-semibold uppercase tracking-wider text-accent-strong">1. Run</div>
              <div class="mt-3 rounded-2xl border border-border bg-surface-2 p-4 font-mono text-sm text-ink overflow-x-auto shadow-inner-glow">
                python qlbmLocalHelperInstaller.py
              </div>
            </div>

            <div class="rounded-[20px] border border-border bg-white/85 p-4 shadow-sm">
              <div class="text-[0.72rem] font-semibold uppercase tracking-wider text-accent-strong">2. Start the helper</div>
              <p class="mt-3 text-sm text-ink-muted leading-relaxed">
                The installer creates a launcher and prints the exact start command. The helper listens on
                <span class="inline-flex items-center px-2 py-0.5 mx-1 rounded-lg border border-border bg-surface-2 font-mono text-[0.82em] text-ink">
                  127.0.0.1:8712
                </span>
                by default.
              </p>
            </div>

            <div class="rounded-[20px] border border-border bg-gradient-to-r from-accent/5 to-white p-4 shadow-sm">
              <div class="text-[0.72rem] font-semibold uppercase tracking-wider text-accent-strong">3. Connect</div>
              <p class="mt-3 text-sm text-ink-muted leading-relaxed">
                After the helper is running, continue to the connection step and paste the printed connection code or connect to
                <span class="inline-flex items-center px-2 py-0.5 mx-1 rounded-lg border border-border bg-surface-2 font-mono text-[0.82em] text-ink">
                  http://127.0.0.1:8712
                </span>.
              </p>
            </div>
          </div>

          <div class="mt-5 flex gap-2">
            <button
              class="px-4 py-2 text-xs font-bold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink hover:border-border-hover transition-colors cursor-pointer"
              on:click={onBackToWelcome}>
              Back
            </button>
            <button
              class="px-4 py-2 text-xs font-bold rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
              on:click={onChooseExistingHelper}>
              I started it, continue
            </button>
          </div>
        </div>
      {:else}
        <div class="rounded-[26px] border-2 border-black bg-white/80 p-5 space-y-5 shadow-sm">
        <!-- Connection code -->
        <div class="space-y-1.5">
          <label for="connection-code" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
            Connection code
          </label>
          <textarea
            id="connection-code"
            class="w-full h-28 px-3 py-3 rounded-2xl border border-border bg-white text-sm text-ink font-mono placeholder:text-ink-faint/60 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 resize-none transition-colors shadow-inner-glow"
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

        <div class="flex items-center gap-3">
          <div class="flex-1 h-px bg-border"></div>
          <span class="text-[0.65rem] uppercase tracking-widest text-ink-faint">or</span>
          <div class="flex-1 h-px bg-border"></div>
        </div>

        <div class="space-y-1.5">
          <label for="manual-address" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
            Manual helper address
          </label>
          <input
            id="manual-address"
            class="w-full px-3 py-3 rounded-2xl border border-border bg-white text-sm text-ink font-mono placeholder:text-ink-faint/60 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors shadow-inner-glow"
            placeholder="http://127.0.0.1:8712"
            value={manualAddress}
            on:input={onManualAddressInput} />
        </div>

        <div class="flex gap-2">
          <button
            class="px-4 py-2 text-xs font-bold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink hover:border-border-hover transition-colors cursor-pointer"
            on:click={onBackToWelcome}>
            Back
          </button>
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
        </div>
      {/if}
    </div>
  </div>
</div>
