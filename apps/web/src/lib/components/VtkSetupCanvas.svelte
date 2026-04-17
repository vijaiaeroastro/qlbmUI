<script>
  import { onMount } from "svelte";
  import { createSetupScene } from "../viewer/createSetupScene.js";

  export let caseData;

  let container;
  let scene;
  let mountToken = 0;

  async function mountScene() {
    if (!container || !caseData) {
      return;
    }
    const token = ++mountToken;
    scene?.destroy?.();
    scene = createSetupScene(container, caseData);
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

  $: if (container && caseData) {
    mountScene();
  }
</script>

<div
  bind:this={container}
  class="min-h-[520px] rounded-xl border border-border overflow-hidden"
  style="background: linear-gradient(180deg, #0f1319 0%, #151a22 100%);"></div>
