<script>
  import { powerOptions } from "../domain/powersOfTwo.js";

  export let caseData;
  export let onFieldChange;
  export let onGridChange;
  export let onInitialConditionChange;
  export let onSimulationChange;
  export let onAddObject;
  export let onObjectChange;
  export let onDeleteObject;
  export let onClose;

  const directionOptions = ["N", "S", "E", "W", "NE", "NW", "SE", "SW"];
  const gridPowerOptions = powerOptions();

  $: visibleAxes = caseData.dimension === "3D" ? ["x", "y", "z"] : ["x", "y"];
  $: is3D = caseData.dimension === "3D";
  $: cuboidLabel = is3D ? "Cube" : "Square";
</script>

<aside class="w-[25rem] max-w-[42vw] min-w-[21rem] border-r border-border bg-surface-1/97 shadow-panel backdrop-blur-sm flex flex-col min-h-0">
  <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
    <div>
      <div class="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-faint">Case Builder</div>
      <div class="text-xs text-ink-faint">One full scrollable form for the active case.</div>
    </div>
    <button
      class="h-7 w-7 flex items-center justify-center rounded-md border border-border bg-surface-3 text-xs font-bold text-ink-muted hover:text-ink hover:border-border-hover transition-colors cursor-pointer"
      on:click={onClose}
      aria-label="Close case builder"
      title="Close case builder">
      ×
    </button>
  </div>

  <div class="flex-1 overflow-auto p-4 space-y-4">
    <section class="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
      <div>
        <h2 class="text-sm font-display font-bold text-ink">Project</h2>
        <p class="mt-0.5 text-xs text-ink-faint">Name and notes for this case.</p>
      </div>

      <div class="space-y-1.5">
        <label for="project-name" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Project name</label>
        <input
          id="project-name"
          class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink placeholder:text-ink-faint/60 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
          value={caseData.name}
          on:input={(event) => onFieldChange("name", event.currentTarget.value)} />
      </div>

      <div class="space-y-1.5">
        <label for="project-notes" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Notes</label>
        <textarea
          id="project-notes"
          class="w-full h-28 px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink placeholder:text-ink-faint/60 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 resize-none transition-colors"
          value={caseData.notes}
          on:input={(event) => onFieldChange("notes", event.currentTarget.value)}></textarea>
      </div>

      <div class="grid grid-cols-3 gap-2">
        {#each [
          ["Objects", caseData.objects.length],
          ["Timesteps", caseData.simulation.timeSteps],
          ["Shots", caseData.simulation.shots]
        ] as [label, value]}
          <div class="rounded-lg border border-border bg-surface-3 p-3">
            <span class="block text-[0.6rem] font-bold uppercase tracking-widest text-ink-faint mb-1">{label}</span>
            <strong class="text-base font-mono text-ink">{value}</strong>
          </div>
        {/each}
      </div>
    </section>

    <section class="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
      <div>
        <h2 class="text-sm font-display font-bold text-ink">Domain</h2>
        <p class="mt-0.5 text-xs text-ink-faint">Dimensionality, lattice model, and grid resolution.</p>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="space-y-1.5">
          <label for="dimension" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Dimension</label>
          <select
            id="dimension"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink focus:outline-none focus:border-accent/40 transition-colors cursor-pointer"
            value={caseData.dimension}
            on:change={(event) => onFieldChange("dimension", event.currentTarget.value)}>
            <option value="2D">2D</option>
            <option value="3D">3D</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label for="lattice-family" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Family</label>
          <select
            id="lattice-family"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink focus:outline-none focus:border-accent/40 transition-colors cursor-pointer"
            value={caseData.latticeFamily}
            on:change={(event) => onFieldChange("latticeFamily", event.currentTarget.value)}>
            <option value="collisionless">Collisionless</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label for="lattice-model" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Model</label>
          <select
            id="lattice-model"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink focus:outline-none focus:border-accent/40 transition-colors cursor-pointer"
            value={caseData.latticeModel}
            on:change={(event) => onFieldChange("latticeModel", event.currentTarget.value)}>
            <option value="D2Q9">D2Q9</option>
          </select>
        </div>
      </div>

      <div class="space-y-2">
        <span class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Grid resolution</span>
        <div class="grid grid-cols-3 gap-2">
          {#each visibleAxes as axis}
            <label class="space-y-1">
              <span class="text-[0.65rem] font-mono font-bold text-ink-faint uppercase">{axis}</span>
              <input
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
                type="number"
                min="2"
                step="2"
                list="case-builder-grid-powers"
                value={caseData.grid[axis]}
                on:input={(event) => onGridChange(axis, Number(event.currentTarget.value))} />
            </label>
          {/each}
        </div>
        <datalist id="case-builder-grid-powers">
          {#each gridPowerOptions as value}
            <option value={value}></option>
          {/each}
        </datalist>
        <p class="text-xs text-ink-faint">Grid axes snap to powers of two.</p>
      </div>
    </section>

    <section class="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
      <div>
        <h2 class="text-sm font-display font-bold text-ink">Initial Conditions</h2>
        <p class="mt-0.5 text-xs text-ink-faint">How probability mass enters the lattice.</p>
      </div>

      <div class="space-y-1.5">
        <label for="initial-preset" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Preset</label>
        <select
          id="initial-preset"
          class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink focus:outline-none focus:border-accent/40 transition-colors cursor-pointer"
          value="uniform"
          on:change={(event) => onInitialConditionChange("preset", event.currentTarget.value)}>
          <option value="uniform">Uniform</option>
          <option value="point" disabled>Point (coming later)</option>
          <option value="directional-inlet" disabled>Directional inlet (coming later)</option>
        </select>
        <p class="text-xs text-ink-faint">Only uniform initialization is available right now. Other source modes are coming later.</p>
      </div>

      <div class="space-y-2">
        <span class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Directions</span>
        <div class="flex flex-wrap gap-1.5">
          {#each directionOptions as direction}
            <button
              type="button"
              class="px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer
                border-border bg-surface-3 text-ink-faint opacity-45 cursor-not-allowed"
              disabled={true}>
              {direction}
            </button>
          {/each}
        </div>
        <p class="text-xs text-ink-faint">Directional initial conditions are not enabled yet.</p>
      </div>

      <div class="space-y-2">
        <span class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Seed region</span>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {#each visibleAxes as axis}
            <label class="space-y-1">
              <span class="text-[0.65rem] font-mono font-bold text-ink-faint uppercase">{axis} min</span>
              <input
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
                type="number"
                value={caseData.initialConditions.region[`${axis}Min`]}
                on:input={(event) => onInitialConditionChange(`region.${axis}Min`, Number(event.currentTarget.value))} />
            </label>
            <label class="space-y-1">
              <span class="text-[0.65rem] font-mono font-bold text-ink-faint uppercase">{axis} max</span>
              <input
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
                type="number"
                value={caseData.initialConditions.region[`${axis}Max`]}
                on:input={(event) => onInitialConditionChange(`region.${axis}Max`, Number(event.currentTarget.value))} />
            </label>
          {/each}
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
      <div>
        <h2 class="text-sm font-display font-bold text-ink">Execution</h2>
        <p class="mt-0.5 text-xs text-ink-faint">Run length and sampling.</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label for="time-steps" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Timesteps</label>
          <input
            id="time-steps"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
            type="number"
            min="1"
            value={caseData.simulation.timeSteps}
            on:input={(event) => onSimulationChange("timeSteps", Number(event.currentTarget.value))} />
        </div>
        <div class="space-y-1.5">
          <label for="shots" class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Shots</label>
          <input
            id="shots"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
            type="number"
            min="1"
            value={caseData.simulation.shots}
            on:input={(event) => onSimulationChange("shots", Number(event.currentTarget.value))} />
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-sm font-display font-bold text-ink">Obstacles</h2>
          <p class="mt-0.5 text-xs text-ink-faint">Solid box geometry in the domain.</p>
        </div>
        <div class="flex gap-2">
          <button
            class="px-3 py-1.5 text-xs font-bold rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
            on:click={() => onAddObject("cuboid")}>
            + {cuboidLabel}
          </button>
          <button
            class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface-3 text-ink-faint opacity-50 cursor-not-allowed"
            type="button"
            disabled={true}>
            + {is3D ? "Sphere" : "Circle"} · later
          </button>
        </div>
      </div>
      <p class="text-xs text-ink-faint">The current MSQLBM demo path supports box obstacles in 2D and 3D. Circle and sphere support are disabled for now.</p>

      {#if caseData.objects.length === 0}
        <div class="rounded-xl border border-dashed border-border bg-surface-3/40 px-4 py-8 text-center">
          <p class="text-sm text-ink-muted">No obstacles yet.</p>
          <p class="mt-1 text-xs text-ink-faint">Add a {cuboidLabel.toLowerCase()} to place solid geometry in the domain.</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each caseData.objects as item}
            <div class="rounded-xl border border-border bg-surface-3 p-3 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <strong class="text-sm text-ink">{item.name}</strong>
                  <div class="text-[0.65rem] text-ink-faint mt-0.5">{cuboidLabel} · {item.boundary}</div>
                </div>
                <button
                  class="px-2.5 py-1 text-[0.65rem] font-semibold rounded-md border border-bad/20 bg-bad-glow text-bad hover:bg-bad/15 transition-colors cursor-pointer"
                  on:click={() => onDeleteObject(item.id)}>
                  Delete
                </button>
              </div>

              <div class="space-y-1.5">
                <label for={`${item.id}-name`} class="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">Name</label>
                <input
                  id={`${item.id}-name`}
                  class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink focus:outline-none focus:border-accent/40 transition-colors"
                  value={item.name}
                  on:input={(event) => onObjectChange(item.id, "name", event.currentTarget.value)} />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label for={`${item.id}-shape`} class="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">Shape</label>
                  <select
                    id={`${item.id}-shape`}
                    class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink focus:outline-none focus:border-accent/40 transition-colors cursor-pointer"
                    value="cuboid"
                    disabled={true}>
                    <option value="cuboid">{cuboidLabel}</option>
                  </select>
                  <p class="text-[0.65rem] text-ink-faint">Only box obstacles are enabled in the runnable demo path.</p>
                </div>
                <div class="space-y-1.5">
                  <label for={`${item.id}-boundary`} class="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">Boundary</label>
                  <select
                    id={`${item.id}-boundary`}
                    class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink focus:outline-none focus:border-accent/40 transition-colors cursor-pointer"
                    value={item.boundary}
                    on:change={(event) => onObjectChange(item.id, "boundary", event.currentTarget.value)}>
                    <option value="bounceback">Bounceback</option>
                    <option value="specular">Specular</option>
                  </select>
                </div>
              </div>

              <div class="space-y-2">
                <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">Position</span>
                <div class="grid grid-cols-3 gap-2">
                  {#each visibleAxes as axis}
                    <label class="space-y-1">
                      <span class="text-[0.6rem] font-mono font-bold text-ink-faint uppercase">{axis}</span>
                      <input
                        class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 transition-colors"
                        type="number"
                        value={item.position[axis]}
                        on:input={(event) => onObjectChange(item.id, `position.${axis}`, Number(event.currentTarget.value))} />
                    </label>
                  {/each}
                </div>
              </div>

              <div class="space-y-2">
                <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">Size</span>
                <div class="grid grid-cols-3 gap-2">
                  <label class="space-y-1">
                    <span class="text-[0.6rem] font-mono font-bold text-ink-faint">{is3D ? "Edge" : "Side"}</span>
                    <input
                      class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 transition-colors"
                      type="number"
                      min="1"
                      value={item.size.width}
                      on:input={(event) => onObjectChange(item.id, "size.width", Number(event.currentTarget.value))} />
                  </label>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</aside>
