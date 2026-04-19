<script>
  import QlbmEmbeddedViewer from "./QlbmEmbeddedViewer.svelte";
  import CodeBlock from "./CodeBlock.svelte";

  export let caseData;
  export let selectedTab = "preview";
  export let generatedScript = "";
  export let needsDimensionChoice = false;
  export let preferredCaseDimension = "2D";
  export let onBack;
  export let onChangeTab;
  export let onInitializeCase;
  export let onSubmit;

  const tabs = [
    { id: "preview", label: "Preview" },
    { id: "case", label: "Case JSON" },
    { id: "script", label: "Python" }
  ];

  const directionOptions = ["N", "S", "E", "W", "NE", "NW", "SE", "SW"];
  const wizardStepLabels = {
    dimension: "Dimension",
    name: "Project name",
    grid: "Grid size",
    preset: "Initial condition",
    directions: "Directions",
    objects: "Objects",
    execution: "Execution",
    review: "Visualize"
  };

  function createWizardState(dimension = "2D") {
    return {
      dimension,
      name: "",
      grid: dimension === "3D"
        ? { x: 24, y: 24, z: 12 }
        : { x: 16, y: 16, z: 8 },
      preset: "uniform",
      directions: ["E"],
      starterObstacle: "none",
      simulation: {
        timeSteps: 5,
        shots: 256
      }
    };
  }

  function previewLineCount(value, maximum) {
    return Math.max(2, Math.min(Math.round(Number(value) || 2), maximum));
  }

  function line(x1, y1, x2, y2) {
    return { x1, y1, x2, y2 };
  }

  function point(x, y) {
    return { x, y };
  }

  function lerp(a, b, t) {
    return a + ((b - a) * t);
  }

  function lerpPoint(a, b, t) {
    return point(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
  }

  function pointsAttr(points) {
    return points.map(({ x, y }) => `${x},${y}`).join(" ");
  }

  function build2DGridPreview(grid) {
    const xCount = previewLineCount(grid.x, 64);
    const yCount = previewLineCount(grid.y, 64);
    const x0 = 44;
    const y0 = 26;
    const width = 228;
    const height = 188;

    return {
      x0,
      y0,
      width,
      height,
      verticalLines: Array.from({ length: xCount + 1 }, (_, index) => {
        const x = x0 + ((width / xCount) * index);
        return line(x, y0, x, y0 + height);
      }),
      horizontalLines: Array.from({ length: yCount + 1 }, (_, index) => {
        const y = y0 + ((height / yCount) * index);
        return line(x0, y, x0 + width, y);
      })
    };
  }

  function build3DGridPreview(grid) {
    const xCount = previewLineCount(grid.x, 48);
    const yCount = previewLineCount(grid.y, 48);
    const zCount = previewLineCount(grid.z, 24);

    const frontTopLeft = point(76, 72);
    const width = 132;
    const height = 118;
    const depthX = 56;
    const depthY = -38;

    const frontTopRight = point(frontTopLeft.x + width, frontTopLeft.y);
    const frontBottomLeft = point(frontTopLeft.x, frontTopLeft.y + height);
    const frontBottomRight = point(frontTopRight.x, frontTopRight.y + height);
    const backTopLeft = point(frontTopLeft.x + depthX, frontTopLeft.y + depthY);
    const backTopRight = point(frontTopRight.x + depthX, frontTopRight.y + depthY);
    const backBottomRight = point(frontBottomRight.x + depthX, frontBottomRight.y + depthY);

    return {
      topFacePoints: pointsAttr([backTopLeft, backTopRight, frontTopRight, frontTopLeft]),
      sideFacePoints: pointsAttr([frontTopRight, backTopRight, backBottomRight, frontBottomRight]),
      frontFacePoints: pointsAttr([frontTopLeft, frontTopRight, frontBottomRight, frontBottomLeft]),
      frontVerticals: Array.from({ length: xCount - 1 }, (_, index) => {
        const t = (index + 1) / xCount;
        return line(
          lerp(frontTopLeft.x, frontTopRight.x, t),
          lerp(frontTopLeft.y, frontTopRight.y, t),
          lerp(frontBottomLeft.x, frontBottomRight.x, t),
          lerp(frontBottomLeft.y, frontBottomRight.y, t)
        );
      }),
      frontHorizontals: Array.from({ length: yCount - 1 }, (_, index) => {
        const t = (index + 1) / yCount;
        return line(
          lerp(frontTopLeft.x, frontBottomLeft.x, t),
          lerp(frontTopLeft.y, frontBottomLeft.y, t),
          lerp(frontTopRight.x, frontBottomRight.x, t),
          lerp(frontTopRight.y, frontBottomRight.y, t)
        );
      }),
      topDepthLines: Array.from({ length: xCount - 1 }, (_, index) => {
        const t = (index + 1) / xCount;
        const start = lerpPoint(frontTopLeft, frontTopRight, t);
        const end = lerpPoint(backTopLeft, backTopRight, t);
        return line(start.x, start.y, end.x, end.y);
      }),
      topWidthLines: Array.from({ length: zCount - 1 }, (_, index) => {
        const t = (index + 1) / zCount;
        const start = lerpPoint(frontTopLeft, backTopLeft, t);
        const end = lerpPoint(frontTopRight, backTopRight, t);
        return line(start.x, start.y, end.x, end.y);
      }),
      sideHeightLines: Array.from({ length: yCount - 1 }, (_, index) => {
        const t = (index + 1) / yCount;
        const start = lerpPoint(frontTopRight, frontBottomRight, t);
        const end = lerpPoint(backTopRight, backBottomRight, t);
        return line(start.x, start.y, end.x, end.y);
      }),
      sideDepthLines: Array.from({ length: zCount - 1 }, (_, index) => {
        const t = (index + 1) / zCount;
        const start = lerpPoint(frontTopRight, backTopRight, t);
        const end = lerpPoint(frontBottomRight, backBottomRight, t);
        return line(start.x, start.y, end.x, end.y);
      }),
      outlineLines: [
        line(backTopLeft.x, backTopLeft.y, backTopRight.x, backTopRight.y),
        line(backTopRight.x, backTopRight.y, backBottomRight.x, backBottomRight.y),
        line(backTopLeft.x, backTopLeft.y, frontTopLeft.x, frontTopLeft.y),
        line(backTopRight.x, backTopRight.y, frontTopRight.x, frontTopRight.y),
        line(backBottomRight.x, backBottomRight.y, frontBottomRight.x, frontBottomRight.y)
      ]
    };
  }

  let wizard = createWizardState(preferredCaseDimension);
  let wizardStepIndex = 0;
  let wizardVisible = false;

  $: if (needsDimensionChoice && !wizardVisible) {
    wizard = createWizardState(preferredCaseDimension);
    wizardStepIndex = 0;
    wizardVisible = true;
  }

  $: if (!needsDimensionChoice) {
    wizardVisible = false;
  }

  $: wizardSteps = [
    "dimension",
    "name",
    "grid",
    "preset",
    ...(wizard.preset === "uniform" ? [] : ["directions"]),
    "objects",
    "execution",
    "review"
  ];

  $: if (wizardStepIndex > wizardSteps.length - 1) {
    wizardStepIndex = wizardSteps.length - 1;
  }

  $: activeStep = wizardSteps[wizardStepIndex] || "dimension";
  $: stepPosition = wizardStepIndex + 1;
  $: stepTitle = {
    dimension: "Start with the case dimension",
    name: "Name the project",
    grid: "Set the grid resolution",
    preset: "Choose the initial condition",
    directions: "Choose flow directions",
    objects: "Add a starter obstacle",
    execution: "Set run length and shots",
    review: "Review and visualize the case"
  }[activeStep];
  $: stepHint = {
    dimension: "Pick the working space first. Everything else adapts to that choice.",
    name: "This can be changed later from the case builder.",
    grid: "Use a quick preset or enter the exact lattice size you want.",
    preset: "This controls how probability mass enters the lattice.",
    directions: "Directional choices will be shown in the renderer and can be edited later.",
    objects: "Start with one obstacle or none. You can add more once the case is visualized.",
    execution: "These are just launch defaults. You can refine them before running.",
    review: "This is a fast-start pass. You can edit every value later from the case builder."
  }[activeStep];

  $: gridPresets = wizard.dimension === "3D"
    ? [
        { label: "8 × 8 × 8", values: { x: 8, y: 8, z: 8 } },
        { label: "16 × 16 × 16", values: { x: 16, y: 16, z: 16 } },
        { label: "32 × 32 × 32", values: { x: 32, y: 32, z: 32 } }
      ]
    : [
        { label: "8 × 8", values: { x: 8, y: 8 } },
        { label: "16 × 16", values: { x: 16, y: 16 } },
        { label: "32 × 32", values: { x: 32, y: 32 } },
        { label: "64 × 64", values: { x: 64, y: 64 } }
      ];

  $: starterObstacleChoices = wizard.dimension === "3D"
    ? [
        { value: "none", label: "No obstacle", description: "Start with a clean domain." },
        { value: "cuboid", label: "Cube", description: "Add one centered solid cube." }
      ]
    : [
        { value: "none", label: "No obstacle", description: "Start with a clean domain." },
        { value: "cuboid", label: "Square", description: "Add one centered square obstacle." }
      ];

  $: summaryRows = [
    { label: "Dimension", value: wizard.dimension },
    {
      label: "Grid",
      value: wizard.dimension === "3D"
        ? `${wizard.grid.x} × ${wizard.grid.y} × ${wizard.grid.z}`
        : `${wizard.grid.x} × ${wizard.grid.y}`
    },
    { label: "Initial condition", value: wizard.preset === "directional-inlet" ? "Directional inlet" : wizard.preset === "point" ? "Point" : "Uniform" },
    { label: "Directions", value: wizard.preset === "uniform" ? "Not used" : wizard.directions.join(", ") || "None selected" },
    {
      label: "Starter obstacle",
      value: starterObstacleChoices.find((choice) => choice.value === wizard.starterObstacle)?.label || "No obstacle"
    },
    { label: "Execution", value: `${wizard.simulation.timeSteps} timesteps · ${wizard.simulation.shots} shots` }
  ];
  $: gridPreview2D = build2DGridPreview(wizard.grid);
  $: gridPreview3D = build3DGridPreview(wizard.grid);
  $: gridPreviewKey = `${wizard.dimension}-${wizard.grid.x}-${wizard.grid.y}-${wizard.grid.z}`;

  $: canMoveForward = activeStep !== "directions" || wizard.directions.length > 0;

  function setWizardDimension(dimension) {
    const previousName = wizard.name;
    const previousPreset = wizard.preset;
    const previousDirections = wizard.directions.length ? wizard.directions : ["E"];
    const previousObstacle = wizard.starterObstacle;
    const previousSimulation = structuredClone(wizard.simulation);

    wizard = {
      ...createWizardState(dimension),
      name: previousName,
      preset: previousPreset,
      directions: previousDirections,
      starterObstacle: previousObstacle,
      simulation: previousSimulation
    };

    wizardStepIndex = 1;
  }

  function applyGridPreset(values) {
    wizard = {
      ...wizard,
      grid: {
        x: values.x ?? wizard.grid.x,
        y: values.y ?? wizard.grid.y,
        z: values.z ?? wizard.grid.z
      }
    };
  }

  function updateWizardName(event) {
    wizard = {
      ...wizard,
      name: event.currentTarget.value
    };
  }

  function updateWizardGrid(axis, value) {
    const numeric = Math.max(2, Number(value) || 2);
    wizard = {
      ...wizard,
      grid: {
        ...wizard.grid,
        [axis]: numeric
      }
    };
  }

  function updateWizardSimulation(key, value) {
    const numeric = Math.max(1, Number(value) || 1);
    wizard = {
      ...wizard,
      simulation: {
        ...wizard.simulation,
        [key]: numeric
      }
    };
  }

  function setWizardPreset(preset) {
    wizard = {
      ...wizard,
      preset,
      directions: wizard.directions.length ? wizard.directions : ["E"]
    };
  }

  function toggleDirection(direction) {
    const next = wizard.directions.includes(direction)
      ? wizard.directions.filter((item) => item !== direction)
      : [...wizard.directions, direction];

    wizard = {
      ...wizard,
      directions: next
    };
  }

  function setStarterObstacle(value) {
    wizard = {
      ...wizard,
      starterObstacle: value === "cuboid" || value === "none" ? value : "none"
    };
  }

  function nextStep() {
    if (!canMoveForward) {
      return;
    }

    wizardStepIndex = Math.min(wizardStepIndex + 1, wizardSteps.length - 1);
  }

  function previousStep() {
    wizardStepIndex = Math.max(wizardStepIndex - 1, 0);
  }

  function completeWizard() {
    onInitializeCase({
      dimension: wizard.dimension,
      name: wizard.name,
      grid: wizard.grid,
      preset: wizard.preset,
      directions: wizard.directions,
      starterObstacle: wizard.starterObstacle,
      simulation: wizard.simulation
    });
  }

  function wizardCardClass(selected) {
    return selected
      ? "border-accent-strong bg-accent/10"
      : "border-border bg-white/80 hover:border-accent/30 hover:bg-surface-0";
  }
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
      <span class="text-xs font-display font-bold text-ink">
        {needsDimensionChoice ? "New Case" : caseData.name || "Untitled case"}
      </span>
      {#if needsDimensionChoice}
        <span class="px-2 py-0.5 text-[0.6rem] font-mono font-bold uppercase tracking-widest rounded-full border border-border bg-surface-3 text-ink-faint">
          Guided setup
        </span>
      {:else}
        <span class="px-2 py-0.5 text-[0.6rem] font-mono font-bold uppercase tracking-widest rounded-full border border-border bg-surface-3 text-ink-faint">
          {caseData.dimension} · {caseData.grid.x}×{caseData.grid.y}{caseData.dimension === "3D" ? `×${caseData.grid.z}` : ""}
        </span>
      {/if}
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-1 py-1">
        {#each tabs as tab}
          <button
            class="px-2.5 py-1 text-[0.7rem] font-semibold rounded-md border transition-all cursor-pointer
              {selectedTab === tab.id
                ? 'border-accent/30 bg-accent/10 text-accent'
                : 'border-transparent bg-transparent text-ink-faint hover:text-ink-muted'}"
            disabled={needsDimensionChoice && tab.id !== "preview"}
            class:opacity-40={needsDimensionChoice && tab.id !== "preview"}
            class:cursor-not-allowed={needsDimensionChoice && tab.id !== "preview"}
            on:click={() => onChangeTab(tab.id)}>
            {tab.label}
          </button>
        {/each}
      </div>
      <button
        class="px-4 py-1.5 text-xs font-bold rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
        disabled={needsDimensionChoice}
        class:opacity-40={needsDimensionChoice}
        class:cursor-not-allowed={needsDimensionChoice}
        on:click={onSubmit}>
        Run Locally ▶
      </button>
    </div>
  </div>

  <div class="flex-1 min-h-0 rounded-xl border border-border bg-surface-2 overflow-hidden flex flex-col">
    <div class="flex-1 min-h-0 overflow-hidden p-3">
      {#if needsDimensionChoice}
        <div class="h-full rounded-[28px] border border-border bg-gradient-to-br from-surface-0 via-surface-1 to-accent/5 p-5 md:p-6">
          <div class="grid h-full min-h-0 grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside class="rounded-[26px] border border-border bg-surface-0/90 p-5 shadow-sm">
              <div class="text-[0.72rem] font-mono font-bold uppercase tracking-[0.2em] text-accent-strong">Guided Setup</div>
              <h2 class="mt-3 text-2xl font-display font-bold text-ink">Set up a QLBM simulation one step at a time</h2>
              <p class="mt-2 text-sm leading-relaxed text-ink-muted">
                This is just the fast-start path. You can edit every value later from the case builder.
              </p>

              <div class="mt-6 space-y-2">
                {#each wizardSteps as stepId, index}
                  <div class="flex items-center gap-3 rounded-2xl border px-3 py-2.5
                    {index === wizardStepIndex
                      ? 'border-accent/30 bg-accent/10'
                      : index < wizardStepIndex
                        ? 'border-good/20 bg-good-glow'
                        : 'border-border bg-surface-2'}">
                    <div class="flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-mono font-bold
                      {index === wizardStepIndex
                        ? 'border-accent/30 bg-white text-accent-strong'
                        : index < wizardStepIndex
                          ? 'border-good/20 bg-white text-good'
                          : 'border-border bg-surface-0 text-ink-faint'}">
                      {index + 1}
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs font-semibold text-ink">
                        {wizardStepLabels[stepId]}
                      </div>
                      <div class="text-[0.68rem] text-ink-faint">
                        {index < wizardStepIndex ? "Completed" : index === wizardStepIndex ? "Current" : "Coming up"}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </aside>

            <section class="flex min-h-0 flex-col rounded-[30px] border-2 border-black bg-white/88 shadow-[0_20px_40px_rgba(10,25,41,0.08)]">
              <div class="border-b border-border px-6 py-5">
                <div class="text-[0.68rem] font-mono font-bold uppercase tracking-[0.2em] text-accent-strong">
                  Step {stepPosition} of {wizardSteps.length}
                </div>
                <h3 class="mt-2 text-2xl font-display font-bold text-ink">{stepTitle}</h3>
                <p class="mt-2 text-sm leading-relaxed text-ink-muted">{stepHint}</p>
              </div>

              <div class="flex-1 overflow-auto px-6 py-5">
                {#if activeStep === "dimension"}
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <button
                      class="rounded-[26px] border p-6 text-left transition-all cursor-pointer {wizardCardClass(wizard.dimension === '2D')}"
                      on:click={() => setWizardDimension("2D")}>
                      <div class="flex items-center justify-between gap-3">
                        <div class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent-strong font-mono font-bold">
                          2D
                        </div>
                        {#if preferredCaseDimension === "2D"}
                          <span class="text-[0.62rem] font-mono uppercase tracking-[0.18em] text-accent-strong">Last used</span>
                        {/if}
                      </div>
                      <div class="mt-5 text-xl font-display font-bold text-ink">2D Case</div>
                      <p class="mt-2 text-sm leading-relaxed text-ink-muted">
                        Flat-lattice setup with square obstacles, generated Python, and VTI output ready to run.
                      </p>
                    </button>

                    <button
                      class="rounded-[26px] border p-6 text-left transition-all cursor-pointer {wizardCardClass(wizard.dimension === '3D')}"
                      on:click={() => setWizardDimension("3D")}>
                      <div class="flex items-center justify-between gap-3">
                        <div class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent-strong font-mono font-bold">
                          3D
                        </div>
                        {#if preferredCaseDimension === "3D"}
                          <span class="text-[0.62rem] font-mono uppercase tracking-[0.18em] text-accent-strong">Last used</span>
                        {/if}
                      </div>
                      <div class="mt-5 text-xl font-display font-bold text-ink">3D Case</div>
                      <p class="mt-2 text-sm leading-relaxed text-ink-muted">
                        Full 3D setup with cube obstacles, generated Python, and VTI output ready to run.
                      </p>
                    </button>
                  </div>
                {:else if activeStep === "name"}
                  <div class="max-w-2xl space-y-4">
                    <label class="block space-y-2">
                      <span class="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-faint">Project name</span>
                      <input
                        class="w-full rounded-2xl border border-border bg-surface-0 px-4 py-3 text-base text-ink focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
                        placeholder="Untitled Project"
                        value={wizard.name}
                        on:input={updateWizardName} />
                    </label>
                    <p class="text-sm text-ink-faint">
                      Leave it blank if you want to keep the default name for now.
                    </p>
                  </div>
                {:else if activeStep === "grid"}
                  <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div class="space-y-5">
                      <div class="flex flex-wrap gap-2">
                        {#each gridPresets as preset}
                          <button
                            type="button"
                            class="rounded-xl border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer {wizard.grid.x === preset.values.x && wizard.grid.y === preset.values.y && (wizard.dimension !== '3D' || wizard.grid.z === preset.values.z)
                              ? 'border-accent/30 bg-accent/10 text-accent'
                              : 'border-border bg-surface-2 text-ink-muted hover:text-ink'}"
                            on:click={() => applyGridPreset(preset.values)}>
                            {preset.label}
                          </button>
                        {/each}
                      </div>

                      <p class="text-xs text-ink-faint">
                        For the current demo path, keep each lattice axis on powers of two.
                      </p>

                      <div class="grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-3">
                        <label class="space-y-1.5">
                          <span class="text-[0.68rem] font-mono font-bold uppercase tracking-[0.16em] text-ink-faint">X</span>
                          <input
                            class="w-full rounded-2xl border border-border bg-surface-0 px-4 py-3 text-base font-mono text-ink focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
                            type="number"
                            min="2"
                            value={wizard.grid.x}
                            on:input={(event) => updateWizardGrid("x", event.currentTarget.value)} />
                        </label>

                        <label class="space-y-1.5">
                          <span class="text-[0.68rem] font-mono font-bold uppercase tracking-[0.16em] text-ink-faint">Y</span>
                          <input
                            class="w-full rounded-2xl border border-border bg-surface-0 px-4 py-3 text-base font-mono text-ink focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
                            type="number"
                            min="2"
                            value={wizard.grid.y}
                            on:input={(event) => updateWizardGrid("y", event.currentTarget.value)} />
                        </label>

                        {#if wizard.dimension === "3D"}
                          <label class="space-y-1.5">
                            <span class="text-[0.68rem] font-mono font-bold uppercase tracking-[0.16em] text-ink-faint">Z</span>
                            <input
                              class="w-full rounded-2xl border border-border bg-surface-0 px-4 py-3 text-base font-mono text-ink focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
                              type="number"
                              min="2"
                              value={wizard.grid.z}
                              on:input={(event) => updateWizardGrid("z", event.currentTarget.value)} />
                          </label>
                        {/if}
                      </div>
                    </div>

                    <div class="rounded-[24px] border border-border bg-surface-0/95 p-4 shadow-sm">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <div class="text-[0.68rem] font-mono font-bold uppercase tracking-[0.18em] text-accent-strong">Grid Preview</div>
                          <div class="mt-1 text-sm font-semibold text-ink">{wizard.dimension} lattice</div>
                        </div>
                        <div class="rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-[0.68rem] font-mono font-bold text-ink-faint">
                          {wizard.dimension === "3D"
                            ? `${wizard.grid.x} × ${wizard.grid.y} × ${wizard.grid.z}`
                            : `${wizard.grid.x} × ${wizard.grid.y}`}
                        </div>
                      </div>

                      {#key gridPreviewKey}
                        <svg viewBox="0 0 320 240" class="mt-4 w-full overflow-visible border border-border bg-gradient-to-br from-surface-1 to-accent/5">
                        {#if wizard.dimension === "3D"}
                          <polygon points={gridPreview3D.topFacePoints} fill="rgba(76, 163, 211, 0.10)" stroke="rgba(76, 163, 211, 0.28)" stroke-width="1.5" />
                          <polygon points={gridPreview3D.sideFacePoints} fill="rgba(11, 141, 184, 0.12)" stroke="rgba(11, 141, 184, 0.28)" stroke-width="1.5" />
                          <polygon points={gridPreview3D.frontFacePoints} fill="rgba(255,255,255,0.88)" stroke="rgba(10, 25, 41, 0.18)" stroke-width="1.5" />

                          {#each gridPreview3D.topDepthLines as gridLine}
                            <line {...gridLine} stroke="rgba(76, 163, 211, 0.24)" stroke-width="1" />
                          {/each}
                          {#each gridPreview3D.topWidthLines as gridLine}
                            <line {...gridLine} stroke="rgba(76, 163, 211, 0.24)" stroke-width="1" />
                          {/each}
                          {#each gridPreview3D.sideHeightLines as gridLine}
                            <line {...gridLine} stroke="rgba(11, 141, 184, 0.24)" stroke-width="1" />
                          {/each}
                          {#each gridPreview3D.sideDepthLines as gridLine}
                            <line {...gridLine} stroke="rgba(11, 141, 184, 0.24)" stroke-width="1" />
                          {/each}
                          {#each gridPreview3D.frontVerticals as gridLine}
                            <line {...gridLine} stroke="rgba(10, 25, 41, 0.16)" stroke-width="1" />
                          {/each}
                          {#each gridPreview3D.frontHorizontals as gridLine}
                            <line {...gridLine} stroke="rgba(10, 25, 41, 0.16)" stroke-width="1" />
                          {/each}
                          {#each gridPreview3D.outlineLines as outline}
                            <line {...outline} stroke="rgba(10, 25, 41, 0.26)" stroke-width="1.5" />
                          {/each}

                          <text x="242" y="30" font-size="11" font-weight="700" fill="rgba(11,141,184,0.85)">Z</text>
                          <text x="282" y="122" font-size="11" font-weight="700" fill="rgba(11,141,184,0.85)">X</text>
                          <text x="60" y="210" font-size="11" font-weight="700" fill="rgba(11,141,184,0.85)">Y</text>
                        {:else}
                          <rect
                            x={gridPreview2D.x0}
                            y={gridPreview2D.y0}
                            width={gridPreview2D.width}
                            height={gridPreview2D.height}
                            fill="rgba(255,255,255,0.88)"
                            stroke="rgba(10, 25, 41, 0.18)"
                            stroke-width="1.5" />

                          {#each gridPreview2D.verticalLines as gridLine}
                            <line {...gridLine} stroke="rgba(11, 141, 184, 0.18)" stroke-width="1" />
                          {/each}
                          {#each gridPreview2D.horizontalLines as gridLine}
                            <line {...gridLine} stroke="rgba(11, 141, 184, 0.18)" stroke-width="1" />
                          {/each}

                          <text x="160" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="rgba(11,141,184,0.85)">Y</text>
                          <text x="286" y="222" text-anchor="middle" font-size="11" font-weight="700" fill="rgba(11,141,184,0.85)">X</text>
                        {/if}
                        </svg>
                      {/key}

                      <div class="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
                        <div class="rounded-xl border border-border bg-surface-2 px-3 py-2">
                          <div class="font-mono font-bold uppercase tracking-[0.14em] text-ink-faint">X cells</div>
                          <div class="mt-1 text-sm font-semibold text-ink">{wizard.grid.x}</div>
                        </div>
                        <div class="rounded-xl border border-border bg-surface-2 px-3 py-2">
                          <div class="font-mono font-bold uppercase tracking-[0.14em] text-ink-faint">Y cells</div>
                          <div class="mt-1 text-sm font-semibold text-ink">{wizard.grid.y}</div>
                        </div>
                        {#if wizard.dimension === "3D"}
                          <div class="rounded-xl border border-border bg-surface-2 px-3 py-2">
                            <div class="font-mono font-bold uppercase tracking-[0.14em] text-ink-faint">Z cells</div>
                            <div class="mt-1 text-sm font-semibold text-ink">{wizard.grid.z}</div>
                          </div>
                        {/if}
                      </div>

                      <p class="mt-3 text-xs leading-relaxed text-ink-faint">
                        The preview is schematic. Large grids are compressed here for readability, but the exact lattice counts are preserved.
                      </p>
                    </div>
                  </div>
                {:else if activeStep === "preset"}
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {#each [
                      {
                        value: "uniform",
                        label: "Uniform",
                        description: "Fill the seed region without directional glyphs.",
                        available: true
                      },
                      {
                        value: "point",
                        label: "Point",
                        description: "Coming later.",
                        available: false
                      },
                      {
                        value: "directional-inlet",
                        label: "Directional inlet",
                        description: "Coming later.",
                        available: false
                      }
                    ] as preset}
                      <button
                        type="button"
                        disabled={!preset.available}
                        class="h-full min-h-[132px] rounded-[24px] border p-5 text-left transition-all {preset.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-65'} {wizardCardClass(wizard.preset === preset.value && preset.available)}"
                        on:click={() => preset.available && setWizardPreset(preset.value)}>
                        <div class="flex items-start justify-between gap-3">
                          <div class="text-lg font-display font-bold text-ink">{preset.label}</div>
                          {#if !preset.available}
                            <span class="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[0.62rem] font-mono font-bold uppercase tracking-[0.16em] text-ink-faint">
                              Coming later
                            </span>
                          {/if}
                        </div>
                        <p class="mt-2 text-sm leading-relaxed text-ink-muted">{preset.description}</p>
                      </button>
                    {/each}
                  </div>
                {:else if activeStep === "directions"}
                  <div class="max-w-3xl">
                    <div class="flex flex-wrap gap-2">
                      {#each directionOptions as direction}
                        <button
                          class="rounded-xl border px-3 py-2 text-sm font-mono font-bold transition-all cursor-pointer
                            {wizard.directions.includes(direction)
                              ? 'border-accent/30 bg-accent/15 text-accent'
                              : 'border-border bg-surface-2 text-ink-faint hover:text-ink'}"
                          on:click={() => toggleDirection(direction)}>
                          {direction}
                        </button>
                      {/each}
                    </div>
                    {#if wizard.directions.length === 0}
                      <p class="mt-3 text-sm text-bad">Choose at least one direction to continue.</p>
                    {/if}
                  </div>
                {:else if activeStep === "objects"}
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {#each starterObstacleChoices as choice}
                      <button
                        type="button"
                        class="rounded-[24px] border p-5 text-left transition-all cursor-pointer {wizardCardClass(wizard.starterObstacle === choice.value)}"
                        on:click={() => setStarterObstacle(choice.value)}>
                        <div class="text-lg font-display font-bold text-ink">{choice.label}</div>
                        <p class="mt-2 text-sm leading-relaxed text-ink-muted">{choice.description}</p>
                      </button>
                    {/each}
                  </div>
                {:else if activeStep === "execution"}
                  <div class="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="space-y-1.5">
                      <span class="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-faint">Timesteps</span>
                      <input
                        class="w-full rounded-2xl border border-border bg-surface-0 px-4 py-3 text-base font-mono text-ink focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
                        type="number"
                        min="1"
                        value={wizard.simulation.timeSteps}
                        on:input={(event) => updateWizardSimulation("timeSteps", event.currentTarget.value)} />
                    </label>

                    <label class="space-y-1.5">
                      <span class="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-faint">Shots</span>
                      <input
                        class="w-full rounded-2xl border border-border bg-surface-0 px-4 py-3 text-base font-mono text-ink focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
                        type="number"
                        min="1"
                        value={wizard.simulation.shots}
                        on:input={(event) => updateWizardSimulation("shots", event.currentTarget.value)} />
                    </label>
                  </div>
                {:else}
                  <div class="space-y-5">
                    <div class="rounded-[24px] border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-ink-muted">
                      The renderer and full case builder will open once you click <span class="font-semibold text-ink">Visualize Case</span>.
                    </div>

                    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {#each summaryRows as row}
                        <div class="rounded-2xl border border-border bg-surface-2 px-4 py-3">
                          <div class="text-[0.68rem] font-mono font-bold uppercase tracking-[0.18em] text-ink-faint">{row.label}</div>
                          <div class="mt-1 text-sm font-semibold text-ink">{row.value}</div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>

              <div class="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
                <button
                  class="rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={wizardStepIndex === 0}
                  on:click={previousStep}>
                  Back
                </button>

                {#if activeStep === "review"}
                  <button
                    class="rounded-xl border border-accent/30 bg-accent/10 px-5 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent/20"
                    on:click={completeWizard}>
                    Visualize Case
                  </button>
                {:else}
                  <button
                    class="rounded-xl border border-accent/30 bg-accent/10 px-5 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!canMoveForward}
                    on:click={nextStep}>
                    Continue
                  </button>
                {/if}
              </div>
            </section>
          </div>
        </div>
      {:else}
        <div class:hidden={selectedTab !== "preview"} class="h-full">
          <QlbmEmbeddedViewer {caseData} />
        </div>
      {/if}
      {#if !needsDimensionChoice && selectedTab === "case"}
        <CodeBlock code={JSON.stringify(caseData, null, 2)} language="json" label="Case JSON" fillHeight={true} />
      {:else if !needsDimensionChoice && selectedTab === "script"}
        <CodeBlock code={generatedScript} language="python" label="Generated Python" fillHeight={true} />
      {/if}
    </div>
  </div>
</div>
