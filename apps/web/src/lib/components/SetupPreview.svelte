<script>
  export let caseData;

  const WIDTH = 920;
  const HEIGHT = 560;
  const MARGIN = 52;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function formatGrid(caseData) {
    return caseData.dimension === "3D"
      ? `${caseData.grid.x} × ${caseData.grid.y} × ${caseData.grid.z}`
      : `${caseData.grid.x} × ${caseData.grid.y}`;
  }

  function build2DLayout(caseData) {
    const gridWidth = Math.max(Number(caseData.grid.x) || 1, 1);
    const gridHeight = Math.max(Number(caseData.grid.y) || 1, 1);
    const availableWidth = WIDTH - MARGIN * 2;
    const availableHeight = HEIGHT - MARGIN * 2;
    const scale = Math.min(availableWidth / gridWidth, availableHeight / gridHeight);
    const domainWidth = gridWidth * scale;
    const domainHeight = gridHeight * scale;
    const left = (WIDTH - domainWidth) / 2;
    const top = (HEIGHT - domainHeight) / 2;

    function x(value) {
      return left + value * scale;
    }

    function y(value) {
      return top + (gridHeight - value) * scale;
    }

    const region = caseData.initialConditions?.region || {};
    const regionRect = {
      x: x(Number(region.xMin) || 0),
      y: y(Number(region.yMax) || 0),
      width: Math.max(((Number(region.xMax) || 0) - (Number(region.xMin) || 0) + 1) * scale, scale * 0.6),
      height: Math.max(((Number(region.yMax) || 0) - (Number(region.yMin) || 0) + 1) * scale, scale * 0.6)
    };

    const objects = caseData.objects.map((item) => {
      if (item.type === "sphere") {
        const radius = Math.max(Number(item.size.radius) || 1, 1) * scale;
        return {
          kind: "sphere",
          cx: x(Number(item.position.x) || 0),
          cy: y(Number(item.position.y) || 0),
          radius,
          item
        };
      }

      const width = Math.max(Number(item.size.width) || 1, 1) * scale;
      const height = Math.max(Number(item.size.height) || 1, 1) * scale;
      return {
        kind: "cuboid",
        x: x(Number(item.position.x) || 0) - width / 2,
        y: y(Number(item.position.y) || 0) - height / 2,
        width,
        height,
        item
      };
    });

    const gridLines = [];
    for (let gx = 0; gx <= gridWidth; gx += 1) {
      gridLines.push({ x1: x(gx), y1: top, x2: x(gx), y2: top + domainHeight });
    }
    for (let gy = 0; gy <= gridHeight; gy += 1) {
      gridLines.push({ x1: left, y1: top + gy * scale, x2: left + domainWidth, y2: top + gy * scale });
    }

    return {
      left,
      top,
      domainWidth,
      domainHeight,
      regionRect,
      objects,
      gridLines,
      scale
    };
  }

  function projectIso(x, y, z, scale, originX, originY) {
    return {
      x: originX + (x - y) * scale * 0.86,
      y: originY - z * scale + (x + y) * scale * 0.44
    };
  }

  function build3DLayout(caseData) {
    const gridX = Math.max(Number(caseData.grid.x) || 1, 1);
    const gridY = Math.max(Number(caseData.grid.y) || 1, 1);
    const gridZ = Math.max(Number(caseData.grid.z) || 1, 1);
    const scale = Math.min((WIDTH - 180) / (gridX + gridY), (HEIGHT - 170) / (gridZ + (gridX + gridY) * 0.44));
    const originX = WIDTH / 2;
    const originY = HEIGHT * 0.72;

    function cuboidFaces(center, size) {
      const x0 = center.x - size.x / 2;
      const x1 = center.x + size.x / 2;
      const y0 = center.y - size.y / 2;
      const y1 = center.y + size.y / 2;
      const z0 = center.z - size.z / 2;
      const z1 = center.z + size.z / 2;

      const p = {
        a: projectIso(x0, y0, z0, scale, originX, originY),
        b: projectIso(x1, y0, z0, scale, originX, originY),
        c: projectIso(x1, y1, z0, scale, originX, originY),
        d: projectIso(x0, y1, z0, scale, originX, originY),
        e: projectIso(x0, y0, z1, scale, originX, originY),
        f: projectIso(x1, y0, z1, scale, originX, originY),
        g: projectIso(x1, y1, z1, scale, originX, originY),
        h: projectIso(x0, y1, z1, scale, originX, originY)
      };

      return {
        top: `${p.e.x},${p.e.y} ${p.f.x},${p.f.y} ${p.g.x},${p.g.y} ${p.h.x},${p.h.y}`,
        left: `${p.e.x},${p.e.y} ${p.h.x},${p.h.y} ${p.d.x},${p.d.y} ${p.a.x},${p.a.y}`,
        right: `${p.f.x},${p.f.y} ${p.g.x},${p.g.y} ${p.c.x},${p.c.y} ${p.b.x},${p.b.y}`
      };
    }

    const domain = cuboidFaces(
      { x: gridX / 2, y: gridY / 2, z: gridZ / 2 },
      { x: gridX, y: gridY, z: gridZ }
    );

    const objects = caseData.objects.map((item) => {
      if (item.type === "sphere") {
        const radius = Math.max(Number(item.size.radius) || 1, 1);
        const center = projectIso(
          Number(item.position.x) || 0,
          Number(item.position.y) || 0,
          Number(item.position.z) || radius,
          scale,
          originX,
          originY
        );
        return {
          kind: "sphere",
          cx: center.x,
          cy: center.y,
          rx: radius * scale * 0.9,
          ry: radius * scale * 0.58,
          item
        };
      }

      return {
        kind: "cuboid",
        faces: cuboidFaces(
          {
            x: Number(item.position.x) || 0,
            y: Number(item.position.y) || 0,
            z: Number(item.position.z) || 0
          },
          {
            x: Math.max(Number(item.size.width) || 1, 1),
            y: Math.max(Number(item.size.height) || 1, 1),
            z: Math.max(Number(item.size.depth) || 1, 1)
          }
        ),
        item
      };
    });

    const region = caseData.initialConditions?.region || {};
    const regionFaces = cuboidFaces(
      {
        x: ((Number(region.xMin) || 0) + (Number(region.xMax) || 0)) / 2,
        y: ((Number(region.yMin) || 0) + (Number(region.yMax) || 0)) / 2,
        z: ((Number(region.zMin) || 0) + (Number(region.zMax) || 0)) / 2
      },
      {
        x: Math.max((Number(region.xMax) || 0) - (Number(region.xMin) || 0) + 1, 1),
        y: Math.max((Number(region.yMax) || 0) - (Number(region.yMin) || 0) + 1, 1),
        z: Math.max((Number(region.zMax) || 0) - (Number(region.zMin) || 0) + 1, 1)
      }
    );

    return {
      domain,
      objects,
      regionFaces
    };
  }

  $: layout2D = caseData.dimension === "3D" ? null : build2DLayout(caseData);
  $: layout3D = caseData.dimension === "3D" ? build3DLayout(caseData) : null;
</script>

<div class="relative min-h-[520px] rounded-2xl border border-border overflow-hidden bg-white shadow-sm">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(11,141,184,0.08),transparent_28%),linear-gradient(180deg,#fbfdff_0%,#eef4f9_100%)]"></div>

  <div class="relative h-full min-h-[520px]">
    {#if caseData.dimension === "3D"}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} class="block h-full w-full">
        <rect x="24" y="24" width={WIDTH - 48} height={HEIGHT - 48} rx="24" fill="#f8fbfe" stroke="#d5dde7" stroke-width="1.5" />

        <polygon points={layout3D.domain.left} fill="rgba(59,130,246,0.06)" stroke="#7f9db7" stroke-width="1.2" />
        <polygon points={layout3D.domain.right} fill="rgba(59,130,246,0.1)" stroke="#7f9db7" stroke-width="1.2" />
        <polygon points={layout3D.domain.top} fill="rgba(59,130,246,0.14)" stroke="#7f9db7" stroke-width="1.2" />

        <polygon points={layout3D.regionFaces.left} fill="rgba(11,141,184,0.09)" stroke="#0b8db8" stroke-width="1.1" stroke-dasharray="6 5" />
        <polygon points={layout3D.regionFaces.right} fill="rgba(11,141,184,0.12)" stroke="#0b8db8" stroke-width="1.1" stroke-dasharray="6 5" />
        <polygon points={layout3D.regionFaces.top} fill="rgba(11,141,184,0.16)" stroke="#0b8db8" stroke-width="1.1" stroke-dasharray="6 5" />

        {#each layout3D.objects as objectView}
          {#if objectView.kind === "sphere"}
            <ellipse
              cx={objectView.cx}
              cy={objectView.cy}
              rx={objectView.rx}
              ry={objectView.ry}
              fill="rgba(239,68,68,0.18)"
              stroke="#c2410c"
              stroke-width="1.6" />
          {:else}
            <polygon points={objectView.faces.left} fill="rgba(239,68,68,0.12)" stroke="#c2410c" stroke-width="1.3" />
            <polygon points={objectView.faces.right} fill="rgba(239,68,68,0.16)" stroke="#c2410c" stroke-width="1.3" />
            <polygon points={objectView.faces.top} fill="rgba(239,68,68,0.22)" stroke="#c2410c" stroke-width="1.3" />
          {/if}
        {/each}

        <text x="60" y="74" fill="#102031" font-size="22" font-weight="700">3D Technical Preview</text>
        <text x="60" y="100" fill="#607487" font-size="14">Projected schematic for object placement and seed volume, not a final scientific rendering.</text>
        <text x="60" y="470" fill="#607487" font-size="12">X</text>
        <text x="460" y="520" fill="#607487" font-size="12">Y</text>
        <text x="700" y="150" fill="#607487" font-size="12">Z</text>
      </svg>
    {:else}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} class="block h-full w-full">
        <rect x="24" y="24" width={WIDTH - 48} height={HEIGHT - 48} rx="24" fill="#f8fbfe" stroke="#d5dde7" stroke-width="1.5" />

        {#each layout2D.gridLines as line}
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(112,133,153,0.18)"
            stroke-width="1" />
        {/each}

        <rect
          x={layout2D.left}
          y={layout2D.top}
          width={layout2D.domainWidth}
          height={layout2D.domainHeight}
          rx="16"
          fill="rgba(59,130,246,0.03)"
          stroke="#8aa1b6"
          stroke-width="2" />

        <rect
          x={clamp(layout2D.regionRect.x, layout2D.left, layout2D.left + layout2D.domainWidth)}
          y={clamp(layout2D.regionRect.y, layout2D.top, layout2D.top + layout2D.domainHeight)}
          width={Math.min(layout2D.regionRect.width, layout2D.domainWidth)}
          height={Math.min(layout2D.regionRect.height, layout2D.domainHeight)}
          fill="rgba(11,141,184,0.14)"
          stroke="#0b8db8"
          stroke-width="1.5"
          stroke-dasharray="8 6"
          rx="10" />

        {#each layout2D.objects as objectView}
          {#if objectView.kind === "sphere"}
            <circle
              cx={objectView.cx}
              cy={objectView.cy}
              r={objectView.radius}
              fill="rgba(239,68,68,0.14)"
              stroke="#c2410c"
              stroke-width="2" />
          {:else}
            <rect
              x={objectView.x}
              y={objectView.y}
              width={objectView.width}
              height={objectView.height}
              rx="10"
              fill="rgba(239,68,68,0.14)"
              stroke="#c2410c"
              stroke-width="2" />
          {/if}
        {/each}

        <text x="60" y="74" fill="#102031" font-size="22" font-weight="700">2D Domain Preview</text>
        <text x="60" y="100" fill="#607487" font-size="14">Grid-aligned schematic for domain size, obstacle placement, and initial condition region.</text>

        <text x={layout2D.left} y={layout2D.top - 14} fill="#607487" font-size="12">Y</text>
        <text x={layout2D.left + layout2D.domainWidth + 10} y={layout2D.top + layout2D.domainHeight + 2} fill="#607487" font-size="12">X</text>
      </svg>
    {/if}

    <div class="pointer-events-none absolute left-4 right-4 bottom-4 flex flex-wrap justify-between gap-3">
      <div class="rounded-xl border border-border bg-white/92 px-4 py-3 shadow-sm">
        <div class="text-sm font-display font-bold text-ink">{caseData.name || "Untitled Project"}</div>
        <div class="mt-1 text-xs text-ink-faint">{caseData.dimension} / {caseData.latticeFamily} / {caseData.latticeModel}</div>
        <div class="mt-1 text-xs font-mono text-ink-muted">Grid {formatGrid(caseData)}</div>
      </div>

      <div class="rounded-xl border border-border bg-white/92 px-4 py-3 shadow-sm">
        <div class="flex items-center gap-3 text-xs text-ink-muted">
          <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-sm border border-[#8aa1b6] bg-[rgba(59,130,246,0.10)]"></span> Domain</span>
          <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-sm border border-[#0b8db8] bg-[rgba(11,141,184,0.16)]"></span> Seed region</span>
          <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-sm border border-[#c2410c] bg-[rgba(239,68,68,0.16)]"></span> Obstacles</span>
        </div>
      </div>
    </div>
  </div>
</div>
