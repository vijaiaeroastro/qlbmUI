<script>
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

  $: visibleAxes = caseData.dimension === "1D" ? ["x"] : caseData.dimension === "2D" ? ["x", "y"] : ["x", "y", "z"];

  function toggleDirection(direction) {
    const next = caseData.initialConditions.directions.includes(direction)
      ? caseData.initialConditions.directions.filter((item) => item !== direction)
      : [...caseData.initialConditions.directions, direction];
    onInitialConditionChange("directions", next);
  }
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
            <option value="1D">1D</option>
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
                value={caseData.grid[axis]}
                on:input={(event) => onGridChange(axis, Number(event.currentTarget.value))} />
            </label>
          {/each}
        </div>
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
          value={caseData.initialConditions.preset}
          on:change={(event) => onInitialConditionChange("preset", event.currentTarget.value)}>
          <option value="uniform">Uniform</option>
          <option value="point">Point</option>
          <option value="directional-inlet">Directional inlet</option>
        </select>
      </div>

      <div class="space-y-2">
        <span class="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">Directions</span>
        <div class="flex flex-wrap gap-1.5">
          {#each directionOptions as direction}
            <button
              type="button"
              class="px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer
                {caseData.initialConditions.directions.includes(direction)
                  ? 'border-accent/30 bg-accent/15 text-accent'
                  : 'border-border bg-surface-3 text-ink-faint hover:text-ink-muted'}"
              on:click={() => toggleDirection(direction)}>
              {direction}
            </button>
          {/each}
        </div>
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
          <p class="mt-0.5 text-xs text-ink-faint">Solid geometry in the domain.</p>
        </div>
        <div class="flex gap-2">
          <button
            class="px-3 py-1.5 text-xs font-bold rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
            on:click={() => onAddObject("cuboid")}>
            + Cuboid
          </button>
          <button
            class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface-3 text-ink-muted hover:text-ink transition-colors cursor-pointer"
            on:click={() => onAddObject("sphere")}>
            + Sphere
          </button>
        </div>
      </div>

      {#if caseData.objects.length === 0}
        <div class="rounded-xl border border-dashed border-border bg-surface-3/40 px-4 py-8 text-center">
          <p class="text-sm text-ink-muted">No obstacles yet.</p>
          <p class="mt-1 text-xs text-ink-faint">Add a cuboid or sphere to place solid geometry in the domain.</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each caseData.objects as item}
            <div class="rounded-xl border border-border bg-surface-3 p-3 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <strong class="text-sm text-ink">{item.name}</strong>
                  <div class="text-[0.65rem] text-ink-faint mt-0.5">{item.type} · {item.boundary}</div>
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
                    value={item.type}
                    on:change={(event) => onObjectChange(item.id, "type", event.currentTarget.value)}>
                    <option value="cuboid">Cuboid</option>
                    <option value="sphere">Sphere</option>
                  </select>
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
                  {#if item.type === "sphere"}
                    <label class="space-y-1">
                      <span class="text-[0.6rem] font-mono font-bold text-ink-faint">Radius</span>
                      <input
                        class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 transition-colors"
                        type="number"
                        min="1"
                        value={item.size.radius}
                        on:input={(event) => onObjectChange(item.id, "size.radius", Number(event.currentTarget.value))} />
                    </label>
                  {:else}
                    <label class="space-y-1">
                      <span class="text-[0.6rem] font-mono font-bold text-ink-faint">W</span>
                      <input
                        class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 transition-colors"
                        type="number"
                        min="1"
                        value={item.size.width}
                        on:input={(event) => onObjectChange(item.id, "size.width", Number(event.currentTarget.value))} />
                    </label>
                    <label class="space-y-1">
                      <span class="text-[0.6rem] font-mono font-bold text-ink-faint">H</span>
                      <input
                        class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 transition-colors"
                        type="number"
                        min="1"
                        value={item.size.height}
                        on:input={(event) => onObjectChange(item.id, "size.height", Number(event.currentTarget.value))} />
                    </label>
                    {#if caseData.dimension === "3D"}
                      <label class="space-y-1">
                        <span class="text-[0.6rem] font-mono font-bold text-ink-faint">D</span>
                        <input
                          class="w-full px-3 py-2 rounded-lg border border-border bg-surface-0 text-sm text-ink font-mono focus:outline-none focus:border-accent/40 transition-colors"
                          type="number"
                          min="1"
                          value={item.size.depth}
                          on:input={(event) => onObjectChange(item.id, "size.depth", Number(event.currentTarget.value))} />
                      </label>
                    {/if}
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</aside>
