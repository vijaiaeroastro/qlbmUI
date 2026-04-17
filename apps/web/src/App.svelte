<script>
  import { onDestroy, onMount } from "svelte";
  import WorkspaceRail from "./lib/components/WorkspaceRail.svelte";
  import WorkspaceHeader from "./lib/components/WorkspaceHeader.svelte";
  import ConnectModal from "./lib/components/ConnectModal.svelte";
  import RunsView from "./lib/components/RunsView.svelte";
  import SetupView from "./lib/components/SetupView.svelte";
  import ResultsView from "./lib/components/ResultsView.svelte";
  import { decodeConnectionCode } from "./lib/domain/connection.js";
  import { createDefaultCase } from "./lib/domain/defaultCase.js";
  import { generateQlBmScript } from "./lib/domain/scriptGenerator.js";
  import { artifactUrl, checkHealth, createRun, deleteAllRuns, deleteRun, deleteRuns, getRun, listArtifacts, listRuns, normalizeBaseUrl } from "./lib/api/helperClient.js";

  let currentView = "runs";
  let helperAddress = "";
  let helperConnected = false;
  let showConnectModal = true;
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
  let currentStepIndex = 0;
  let isPlaying = false;

  $: generatedScript = generateQlBmScript(caseData);
  $: vtiArtifacts = currentArtifacts.filter((item) => item.path.endsWith(".vti"));
  $: geometryArtifacts = currentArtifacts.filter((item) => item.path.endsWith(".stl"));

  function navigateTo(viewId) {
    if (viewId === "connect") {
      showConnectModal = true;
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

  async function handleConnect() {
    errorMessage = "";
    try {
      const targetAddress = decodedAddress || manualAddress;
      const normalized = normalizeBaseUrl(targetAddress);
      await checkHealth(normalized);
      helperAddress = normalized;
      helperConnected = true;
      showConnectModal = false;
      connectionNotice = "Connected";
      await refreshRuns();
    } catch (error) {
      helperConnected = false;
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
      await checkHealth(candidate);
      helperAddress = candidate;
      helperConnected = true;
      showConnectModal = false;
      connectionNotice = "Auto-connected";
      await refreshRuns();
    } catch {
      connectionNotice = "No local helper detected on default port";
    }
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
    if (run.status === "queued" || run.status === "running") {
      pollTimer = setTimeout(() => {
        pollRunUntilSettled(runId);
      }, 1200);
      return;
    }
    await refreshRuns();
    await openResults(runId);
  }

  function startNewProject() {
    if (!helperConnected) {
      showConnectModal = true;
      return;
    }
    stopPlayback();
    caseData = createDefaultCase();
    setupTab = "preview";
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
      type,
      boundary: "bounceback",
      position: { x: nextIndex * 2, y: nextIndex * 2, z: 0 },
      size: type === "sphere" ? { radius: 2 } : { width: 3, height: 3, depth: 3 }
    };

    caseData = {
      ...caseData,
      objects: [...caseData.objects, nextObject]
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
        } else {
          next[top] = value;
          if (path === "type") {
            next.size = value === "sphere" ? { radius: 2 } : { width: 3, height: 3, depth: 3 };
          }
        }
        return next;
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
    currentArtifacts = [];
    currentStepIndex = 0;
    currentView = "results";
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

    <main class="flex-1 flex flex-col min-w-0 min-h-0 bg-surface-0/45">
      <WorkspaceHeader
        currentView={currentView}
        {helperAddress}
        {helperConnected}
        {connectionNotice}
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
            onFieldChange={updateField}
            onGridChange={updateGrid}
            onInitialConditionChange={updateInitialCondition}
            onSimulationChange={updateSimulation}
            onAddObject={addObject}
            onObjectChange={updateObject}
            onDeleteObject={removeObject}
            onChangeTab={(tabId) => (setupTab = tabId)}
            onSubmit={submitCurrentCase} />
        {:else}
          <ResultsView
            run={currentRun}
            artifacts={currentArtifacts}
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
      {connectionCode}
      {manualAddress}
      {decodedAddress}
      {errorMessage}
      canClose={helperConnected}
      onConnectionCodeInput={handleConnectionCodeInput}
      onManualAddressInput={handleManualAddressInput}
      onDecode={handleDecode}
      onConnect={handleConnect}
      onClose={closeConnectModal} />
  {/if}
</div>
