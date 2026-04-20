<script>
  import { onDestroy, onMount } from "svelte";
  import WorkspaceRail from "./lib/components/WorkspaceRail.svelte";
  import WorkspaceHeader from "./lib/components/WorkspaceHeader.svelte";
  import ConnectModal from "./lib/components/ConnectModal.svelte";
  import CaseBuilderDrawer from "./lib/components/CaseBuilderDrawer.svelte";
  import RunLaunchOverlay from "./lib/components/RunLaunchOverlay.svelte";
  import RunsView from "./lib/components/RunsView.svelte";
  import SetupView from "./lib/components/SetupView.svelte";
  import ResultsView from "./lib/components/ResultsView.svelte";
  import { decodeConnectionCode } from "./lib/domain/connection.js";
  import { createDefaultCase } from "./lib/domain/defaultCase.js";
  import { helperVersionNotice as buildHelperVersionNotice } from "./lib/domain/helperVersion.js";
  import { generateQlBmScript } from "./lib/domain/scriptGenerator.js";
  import { artifactUrl, checkHealth, createRun, deleteAllRuns, deleteRun, deleteRuns, getRun, listArtifacts, listRuns, normalizeBaseUrl } from "./lib/api/helperClient.js";

  let currentView = "runs";
  let helperAddress = "";
  let helperConnected = false;
  let helperVersion = "";
  let helperVersionWarning = "";
  let showConnectModal = true;
  let connectModalStep = "welcome";
  let connectionCode = "";
  let manualAddress = "http://127.0.0.1:8712";
  let decodedAddress = "";
  let errorMessage = "";
  let connectionNotice = "";
  let runs = [];
  let selectedRunIds = [];
  let caseData = createDefaultCase();
  let setupTab = "preview";
  let generatedScript = "";
  let currentRun = null;
  let currentArtifacts = [];
  let pollTimer = null;
  let playbackTimer = null;
  let helperHealthTimer = null;
  let currentStepIndex = 0;
  let isPlaying = false;
  let setupDrawerOpen = false;
  let setupNeedsDimensionChoice = true;
  let preferredCaseDimension = "2D";
  let runLaunchState = null;

  $: generatedScript = generateQlBmScript(caseData);
  $: if (caseData.initialConditions?.preset !== "uniform") {
    caseData = {
      ...caseData,
      initialConditions: {
        ...caseData.initialConditions,
        preset: "uniform",
        directions: ["E"]
      }
    };
  }
  $: if (caseData.objects.some((item) => item.type !== "cuboid")) {
    caseData = {
      ...caseData,
      objects: caseData.objects.map((item) =>
        normalizeObjectForDimension({ ...item, type: "cuboid" }, caseData.dimension)
      )
    };
  }
  $: vtiArtifacts = currentArtifacts.filter((item) => item.path.endsWith(".vti"));
  $: geometryArtifacts = currentArtifacts.filter((item) => item.path.endsWith(".stl"));
  $: runLaunchActive = !!runLaunchState && ["queued", "running"].includes(runLaunchState.status);

  function createObjectSize(dimension) {
    return dimension === "3D"
      ? { width: 3, height: 3, depth: 3 }
      : { width: 3, height: 3, depth: 1 };
  }

  function normalizeObjectForDimension(item, dimension) {
    const next = structuredClone(item);
    const side = Math.max(
      1,
      Number(next.size?.width) || Number(next.size?.height) || Number(next.size?.depth) || Number(next.size?.radius) || 3
    );
    next.type = "cuboid";
    next.size = dimension === "3D"
      ? { width: side, height: side, depth: side }
      : { width: side, height: side, depth: 1 };

    if (dimension !== "3D") {
      next.position = { ...next.position, z: 0 };
    }

    return next;
  }

  function createCaseForDimension(dimension) {
    const nextCase = createDefaultCase();
    nextCase.dimension = dimension;
    nextCase.objects = [];
    nextCase.initialConditions.region = {
      ...nextCase.initialConditions.region,
      zMin: 0,
      zMax: dimension === "3D" ? Math.min(3, Math.max((nextCase.grid.z || 1) - 1, 0)) : 0
    };
    return nextCase;
  }

  function createSeedRegionForWizard(caseDraft, preset, directions) {
    const xMax = Math.max((caseDraft.grid.x || 1) - 1, 0);
    const yMax = Math.max((caseDraft.grid.y || 1) - 1, 0);
    const zMax = Math.max((caseDraft.grid.z || 1) - 1, 0);
    const hasDirection = (token) => directions.includes(token);

    if (preset === "point") {
      const centerX = Math.floor(caseDraft.grid.x / 2);
      const centerY = Math.floor(caseDraft.grid.y / 2);
      const centerZ = caseDraft.dimension === "3D" ? Math.floor(caseDraft.grid.z / 2) : 0;
      return {
        xMin: centerX,
        xMax: centerX,
        yMin: centerY,
        yMax: centerY,
        zMin: centerZ,
        zMax: centerZ
      };
    }

    if (preset === "directional-inlet") {
      if (hasDirection("W") || hasDirection("NW") || hasDirection("SW")) {
        return { xMin: Math.max(xMax - 2, 0), xMax, yMin: 0, yMax, zMin: 0, zMax: caseDraft.dimension === "3D" ? zMax : 0 };
      }
      if (hasDirection("N") || hasDirection("NE") || hasDirection("NW")) {
        return { xMin: 0, xMax, yMin: 0, yMax: Math.min(2, yMax), zMin: 0, zMax: caseDraft.dimension === "3D" ? zMax : 0 };
      }
      if (hasDirection("S") || hasDirection("SE") || hasDirection("SW")) {
        return { xMin: 0, xMax, yMin: Math.max(yMax - 2, 0), yMax, zMin: 0, zMax: caseDraft.dimension === "3D" ? zMax : 0 };
      }

      return { xMin: 0, xMax: Math.min(2, xMax), yMin: 0, yMax, zMin: 0, zMax: caseDraft.dimension === "3D" ? zMax : 0 };
    }

    return {
      xMin: 0,
      xMax,
      yMin: 0,
      yMax,
      zMin: 0,
      zMax: caseDraft.dimension === "3D" ? zMax : 0
    };
  }

  function createStarterObject(type, dimension, grid) {
    const centerX = Math.max(2, Math.floor((grid.x || 1) / 2));
    const centerY = Math.max(2, Math.floor((grid.y || 1) / 2));
    const centerZ = dimension === "3D" ? Math.max(1, Math.floor((grid.z || 1) / 2)) : 0;
    return normalizeObjectForDimension(
      {
        id: "object-1",
        name: "Object 1",
        type: "cuboid",
        boundary: "bounceback",
        position: { x: centerX, y: centerY, z: centerZ },
        size: createObjectSize(dimension)
      },
      dimension
    );
  }

  function coercePositiveInt(value, fallback, minimum = 1) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    return Math.max(minimum, Math.round(numeric));
  }

  function initializeCaseFromWizard(config) {
    const dimension = config.dimension || "2D";
    const nextCase = createCaseForDimension(dimension);
    const gridConfig = config.grid || {};
    nextCase.name = (config.name || "").trim() || nextCase.name;
    nextCase.notes = (config.notes || "").trim() || "";
    nextCase.grid = {
      x: coercePositiveInt(gridConfig.x, nextCase.grid.x, 2),
      y: coercePositiveInt(gridConfig.y, nextCase.grid.y, 2),
      z: dimension === "3D"
        ? coercePositiveInt(gridConfig.z, nextCase.grid.z, 2)
        : nextCase.grid.z
    };

    const directions = Array.isArray(config.directions) && config.directions.length ? config.directions : ["E"];

    nextCase.initialConditions = {
      ...nextCase.initialConditions,
      preset: config.preset || "uniform",
      directions,
      region: createSeedRegionForWizard(nextCase, config.preset || "uniform", directions)
    };

    nextCase.simulation = {
      ...nextCase.simulation,
      timeSteps: coercePositiveInt(config.simulation?.timeSteps, nextCase.simulation.timeSteps, 1),
      shots: coercePositiveInt(config.simulation?.shots, nextCase.simulation.shots, 1)
    };

    if (config.starterObstacle && config.starterObstacle !== "none") {
      nextCase.objects = [createStarterObject(config.starterObstacle, dimension, nextCase.grid)];
    }

    preferredCaseDimension = dimension;
    caseData = nextCase;
    setupNeedsDimensionChoice = false;
    setupDrawerOpen = true;
    setupTab = "preview";
    currentView = "setup";
  }

  function syncRunLaunchState(run) {
    if (!run) {
      return;
    }

    runLaunchState = {
      runId: run.run_id,
      status: run.status,
      stage: run.progress?.stage || run.status || "unknown",
      message: run.progress?.message || "",
      percent: Number(run.progress?.percent ?? 0),
      stdoutTail: typeof run.stdout_tail === "string" ? run.stdout_tail : "",
      stderrTail: typeof run.stderr_tail === "string" ? run.stderr_tail : ""
    };
  }

  function clearRunLaunchState() {
    runLaunchState = null;
  }

  function updateHelperVersionState(health) {
    helperVersion = typeof health?.version === "string" ? health.version : "";
    helperVersionWarning = buildHelperVersionNotice(helperVersion);
  }

  function navigateTo(viewId) {
    if (viewId === "connect") {
      connectModalStep = helperConnected ? "connect" : "welcome";
      showConnectModal = true;
      return;
    }
    if (viewId === "setup") {
      if (currentView === "setup") {
        if (setupNeedsDimensionChoice) {
          return;
        }
        setupDrawerOpen = !setupDrawerOpen;
      } else {
        setupDrawerOpen = !setupNeedsDimensionChoice;
        currentView = "setup";
      }
      return;
    }
    currentView = viewId;
  }

  function handleConnectionCodeInput(event) {
    connectionCode = event.currentTarget.value;
  }

  function handleManualAddressInput(event) {
    manualAddress = event.currentTarget.value;
  }

  function handleDecode() {
    errorMessage = "";
    try {
      decodedAddress = decodeConnectionCode(connectionCode);
    } catch (error) {
      decodedAddress = "";
      errorMessage = error.message;
    }
  }

  async function connectToHelper(targetAddress, notice = "Connected") {
    const normalized = normalizeBaseUrl(targetAddress);
    const health = await checkHealth(normalized);
    helperAddress = normalized;
    helperConnected = true;
    updateHelperVersionState(health);
    showConnectModal = false;
    connectModalStep = "connect";
    connectionNotice = notice;
    startHelperHealthPolling();
    await refreshRuns();
  }

  async function handleConnect() {
    errorMessage = "";
    try {
      await connectToHelper(decodedAddress || manualAddress, "Connected");
    } catch (error) {
      helperConnected = false;
      stopHelperHealthPolling();
      errorMessage = error.message;
    }
  }

  function closeConnectModal() {
    if (!helperConnected) {
      return;
    }
    showConnectModal = false;
  }

  async function autoConnectIfAvailable() {
    const candidate = normalizeBaseUrl(manualAddress);
    try {
      await connectToHelper(candidate, "Auto-connected");
    } catch {
      stopHelperHealthPolling();
      connectModalStep = "welcome";
      connectionNotice = "No local helper detected on default port";
    }
  }

  async function showConnectForm() {
    const candidate = normalizeBaseUrl("http://127.0.0.1:8712");
    decodedAddress = "";
    errorMessage = "";

    try {
      manualAddress = candidate;
      await connectToHelper(candidate, "Connected on default port");
    } catch {
      connectModalStep = "connect";
      errorMessage = `Nothing responded at ${candidate}. Paste a connection code or enter another helper address.`;
    }
  }

  function showInstallGuide() {
    connectModalStep = "install";
    errorMessage = "";
  }

  function stopHelperHealthPolling() {
    if (helperHealthTimer) {
      clearInterval(helperHealthTimer);
      helperHealthTimer = null;
    }
  }

  async function verifyHelperConnection() {
    if (!helperAddress) {
      return;
    }

    try {
      const health = await checkHealth(helperAddress);
      updateHelperVersionState(health);
      if (!helperConnected) {
        helperConnected = true;
        connectionNotice = "Reconnected";
      }
    } catch {
      helperConnected = false;
      helperVersion = "";
      helperVersionWarning = "";
      decodedAddress = "";
      errorMessage = "The local helper is no longer reachable. Start it again or reconnect.";
      connectionNotice = "Helper unavailable";
      clearRunLaunchState();
      connectModalStep = "welcome";
      showConnectModal = true;
      stopHelperHealthPolling();
    }
  }

  function startHelperHealthPolling() {
    stopHelperHealthPolling();
    if (!helperAddress || !helperConnected) {
      return;
    }

    helperHealthTimer = setInterval(() => {
      verifyHelperConnection();
    }, 10000);
  }

  async function refreshRuns() {
    if (!helperAddress) {
      return;
    }
    const response = await listRuns(helperAddress);
    runs = response.runs || [];
    selectedRunIds = selectedRunIds.filter((runId) => runs.some((run) => run.run_id === runId));
  }

  async function openResults(runId) {
    if (!helperAddress) {
      showConnectModal = true;
      return;
    }
    clearRunLaunchState();
    stopPlayback();
    currentRun = await getRun(helperAddress, runId);
    const artifactResponse = await listArtifacts(helperAddress, runId);
    currentArtifacts = (artifactResponse.artifacts || []).map((item) => ({
      ...item,
      url: artifactUrl(helperAddress, runId, item.path)
    }));
    currentStepIndex = 0;
    currentView = "results";
  }

  async function pollRunUntilSettled(runId) {
    clearTimeout(pollTimer);
    const run = await getRun(helperAddress, runId);
    currentRun = run;
    syncRunLaunchState(run);
    if (run.status === "queued" || run.status === "running") {
      pollTimer = setTimeout(() => {
        pollRunUntilSettled(runId);
      }, 1200);
      return;
    }
    clearRunLaunchState();
    await refreshRuns();
    await openResults(runId);
  }

  function startNewProject() {
    if (!helperConnected) {
      showConnectModal = true;
      return;
    }
    clearRunLaunchState();
    stopPlayback();
    caseData = createDefaultCase();
    setupTab = "preview";
    setupNeedsDimensionChoice = true;
    setupDrawerOpen = false;
    currentView = "setup";
  }

  function toggleRunSelection(runId) {
    selectedRunIds = selectedRunIds.includes(runId)
      ? selectedRunIds.filter((value) => value !== runId)
      : [...selectedRunIds, runId];
  }

  async function removeRun(runId) {
    if (!helperConnected) {
      showConnectModal = true;
      return;
    }
    await deleteRun(helperAddress, runId);
    await refreshRuns();
  }

  async function removeSelectedRuns() {
    if (!selectedRunIds.length || !helperConnected) {
      if (!helperConnected) {
        showConnectModal = true;
      }
      return;
    }
    await deleteRuns(helperAddress, selectedRunIds);
    await refreshRuns();
  }

  async function removeAllRuns() {
    if (!helperConnected) {
      showConnectModal = true;
      return;
    }
    await deleteAllRuns(helperAddress);
    await refreshRuns();
  }

  function updateField(key, value) {
    if (key === "dimension") {
      preferredCaseDimension = value;
      setupNeedsDimensionChoice = false;
      caseData = {
        ...caseData,
        dimension: value,
        objects: caseData.objects.map((item) => normalizeObjectForDimension(item, value))
      };
      return;
    }

    caseData = { ...caseData, [key]: value };
  }

  function updateGrid(axis, value) {
    caseData = {
      ...caseData,
      grid: {
        ...caseData.grid,
        [axis]: value
      }
    };
  }

  function updateInitialCondition(key, value) {
    const nextInitialConditions = structuredClone(caseData.initialConditions);
    const path = key.split(".");

    if (path.length === 1) {
      nextInitialConditions[path[0]] = value;
    } else {
      let cursor = nextInitialConditions;
      for (let index = 0; index < path.length - 1; index += 1) {
        cursor = cursor[path[index]];
      }
      cursor[path[path.length - 1]] = value;
    }

    caseData = {
      ...caseData,
      initialConditions: nextInitialConditions
    };
  }

  function updateSimulation(key, value) {
    caseData = {
      ...caseData,
      simulation: {
        ...caseData.simulation,
        [key]: value
      }
    };
  }

  function addObject(type) {
    const nextIndex = caseData.objects.length + 1;
    const nextObject = {
      id: `object-${nextIndex}`,
      name: `Object ${nextIndex}`,
      type: "cuboid",
      boundary: "bounceback",
      position: { x: nextIndex * 2, y: nextIndex * 2, z: 0 },
      size: createObjectSize(caseData.dimension)
    };

    caseData = {
      ...caseData,
      objects: [...caseData.objects, normalizeObjectForDimension(nextObject, caseData.dimension)]
    };
  }

  function updateObject(objectId, path, value) {
    caseData = {
      ...caseData,
      objects: caseData.objects.map((item) => {
        if (item.id !== objectId) {
          return item;
        }

        const next = structuredClone(item);
        const [top, nested] = path.split(".");
        if (nested) {
          next[top][nested] = value;
          if (top === "size" && item.type === "cuboid") {
            const side = Math.max(1, Number(value) || 1);
            next.size.width = side;
            next.size.height = side;
            next.size.depth = caseData.dimension === "3D" ? side : 1;
          }
        } else {
          next[top] = value;
          if (path === "type") {
            next.size = createObjectSize(caseData.dimension);
          }
        }
        return normalizeObjectForDimension(next, caseData.dimension);
      })
    };
  }

  function removeObject(objectId) {
    caseData = {
      ...caseData,
      objects: caseData.objects.filter((item) => item.id !== objectId)
    };
  }

  async function submitCurrentCase() {
    if (!helperAddress) {
      showConnectModal = true;
      return;
    }

    stopPlayback();
    const run = await createRun(helperAddress, {
      script: generateQlBmScript(caseData),
      case: caseData,
      filename: "run.py"
    });

    currentRun = run;
    syncRunLaunchState(run);
    currentArtifacts = [];
    currentStepIndex = 0;
    await pollRunUntilSettled(run.run_id);
  }

  function selectStep(index) {
    if (!vtiArtifacts.length) {
      currentStepIndex = 0;
      return;
    }
    const maxIndex = vtiArtifacts.length - 1;
    currentStepIndex = Math.min(Math.max(index, 0), maxIndex);
  }

  function stepBy(delta) {
    if (!vtiArtifacts.length) {
      return;
    }
    const maxIndex = vtiArtifacts.length - 1;
    currentStepIndex = (currentStepIndex + delta + vtiArtifacts.length) % (maxIndex + 1);
  }

  function stopPlayback() {
    if (playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
    }
    isPlaying = false;
  }

  function togglePlayback() {
    if (!vtiArtifacts.length) {
      return;
    }
    if (isPlaying) {
      stopPlayback();
      return;
    }
    isPlaying = true;
    playbackTimer = setInterval(() => {
      stepBy(1);
    }, 900);
  }

  onDestroy(() => {
    clearTimeout(pollTimer);
    stopPlayback();
    stopHelperHealthPolling();
  });

  onMount(() => {
    autoConnectIfAvailable();
  });
</script>

  <div class="h-screen w-screen overflow-hidden bg-surface-0 p-2 md:p-3">
  <div class="h-full w-full overflow-hidden rounded-[30px] border border-border bg-surface-1/90 shadow-panel backdrop-blur-sm flex">
    <WorkspaceRail
      currentView={currentView}
      {helperConnected}
      currentRun={currentRun}
      onNavigate={navigateTo} />

    {#if currentView === "setup" && setupDrawerOpen && !setupNeedsDimensionChoice}
      <CaseBuilderDrawer
        {caseData}
        onFieldChange={updateField}
        onGridChange={updateGrid}
        onInitialConditionChange={updateInitialCondition}
        onSimulationChange={updateSimulation}
        onAddObject={addObject}
        onObjectChange={updateObject}
        onDeleteObject={removeObject}
        onClose={() => (setupDrawerOpen = false)} />
    {/if}

    <main class="flex-1 flex flex-col min-w-0 min-h-0 bg-surface-0/45">
      <WorkspaceHeader
        currentView={currentView}
        {helperAddress}
        {helperConnected}
        {connectionNotice}
        helperVersionNotice={helperVersionWarning}
        currentRun={currentRun}
        timestepCount={vtiArtifacts.length}
        onNavigate={navigateTo} />

      <section class="flex-1 overflow-auto p-4">
        {#if currentView === "runs"}
          <RunsView
            {runs}
            {selectedRunIds}
            onRefresh={refreshRuns}
            onNewProject={startNewProject}
            onToggleRun={toggleRunSelection}
            onDeleteRun={removeRun}
            onDeleteSelected={removeSelectedRuns}
            onDeleteAll={removeAllRuns}
            onOpenRun={openResults} />
        {:else if currentView === "setup"}
          <SetupView
            {caseData}
            selectedTab={setupTab}
            {generatedScript}
            onBack={() => (currentView = "runs")}
            needsDimensionChoice={setupNeedsDimensionChoice}
            {preferredCaseDimension}
            onChangeTab={(tabId) => (setupTab = tabId)}
            onInitializeCase={initializeCaseFromWizard}
            onSubmit={submitCurrentCase} />
        {:else}
          <ResultsView
            run={currentRun}
            {vtiArtifacts}
            {geometryArtifacts}
            selectedStepIndex={currentStepIndex}
            {isPlaying}
            onSelectStep={selectStep}
            onTogglePlayback={togglePlayback}
            onStepDelta={stepBy}
            onBack={() => {
              stopPlayback();
              currentView = "runs";
            }}
            onRefresh={() => openResults(currentRun.run_id)} />
        {/if}
      </section>
    </main>
  </div>

  {#if showConnectModal}
    <ConnectModal
      step={connectModalStep}
      {connectionCode}
      {manualAddress}
      {decodedAddress}
      {errorMessage}
      canClose={helperConnected}
      onChooseExistingHelper={showConnectForm}
      onChooseInstallHelper={showInstallGuide}
      onBackToWelcome={() => (connectModalStep = "welcome")}
      onConnectionCodeInput={handleConnectionCodeInput}
      onManualAddressInput={handleManualAddressInput}
      onDecode={handleDecode}
      onConnect={handleConnect}
      onClose={closeConnectModal} />
  {/if}

  {#if runLaunchActive}
    <RunLaunchOverlay state={runLaunchState} />
  {/if}
</div>
