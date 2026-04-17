<script>
  import { onMount } from "svelte";
  import { createResultsScene } from "../viewer/createResultsScene.js";

  export let imageArtifact = null;
  export let geometryArtifacts = [];

  let container;
  let scene;
  let mountToken = 0;

  async function mountScene() {
    if (!container) {
      return;
    }
    const token = ++mountToken;
    scene?.destroy?.();
    scene = await createResultsScene(container, imageArtifact, geometryArtifacts);
    if (token !== mountToken) {
      scene?.destroy?.();
    }
  }

  onMount(() => {
    mountScene();
    return () => {
      scene?.destroy?.();
    };
  });

  $: if (container && (imageArtifact || geometryArtifacts.length)) {
    mountScene();
  }
</script>

<div
  bind:this={container}
  class="min-h-[520px] rounded-xl border border-border overflow-hidden"
  style="background: linear-gradient(180deg, #0f1319 0%, #151a22 100%);"></div>
