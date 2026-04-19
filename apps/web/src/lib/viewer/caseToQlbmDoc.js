function safeExtent(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

function domainBounds(caseData) {
  const nx = safeExtent(caseData.grid.x);
  const ny = safeExtent(caseData.grid.y);
  const nz = caseData.dimension === "3D" ? safeExtent(caseData.grid.z) : 1;
  return { nx, ny, nz, bounds: [[0, 0, 0], [nx, ny, nz]] };
}

function obstacleEntity(item, is3D) {
  const x = Number(item.position?.x) || 0;
  const y = Number(item.position?.y) || 0;
  const z = is3D ? Number(item.position?.z) || 0 : 0.5;

  if (item.type === "sphere") {
    return {
      id: item.id,
      kind: "solid.sphere",
      name: item.name,
      params: {
        center: [x, y, z],
        radius: Number(item.size?.radius) || 1
      },
      tags: ["solid", item.boundary]
    };
  }

  const w = Number(item.size?.width) || 1;
  const h = Number(item.size?.height) || 1;
  const d = is3D ? Number(item.size?.depth) || 1 : 1;
  return {
    id: item.id,
    kind: "solid.cuboid",
    name: item.name,
    params: {
      center: [x, y, z],
      size: [w, h, d]
    },
    tags: ["solid", item.boundary]
  };
}

function seedRegionEntity(caseData, is3D, nz) {
  const region = caseData.initialConditions?.region || {};
  const xMin = Number(region.xMin) || 0;
  const xMax = Number(region.xMax) || 0;
  const yMin = Number(region.yMin) || 0;
  const yMax = Number(region.yMax) || 0;
  const zMin = is3D ? Number(region.zMin) || 0 : 0;
  const zMax = is3D ? Number(region.zMax) || 0 : nz;

  if (xMax <= xMin || yMax <= yMin || zMax <= zMin) {
    return null;
  }

  return {
    id: "seed-region",
    kind: "region.box",
    name: "Seed Region",
    params: {
      bounds: [[xMin, yMin, zMin], [xMax, yMax, zMax]]
    },
    tags: ["seed", caseData.initialConditions?.preset || "uniform"]
  };
}

export function caseToQlbmDoc(caseData) {
  const is3D = caseData.dimension === "3D";
  const { nx, ny, nz, bounds } = domainBounds(caseData);

  const entities = [];
  const seed = seedRegionEntity(caseData, is3D, nz);
  if (seed) entities.push(seed);
  for (const item of caseData.objects || []) {
    entities.push(obstacleEntity(item, is3D));
  }

  return {
    namespace: "qlbm",
    version: 1,
    domain: {
      id: "domain",
      bounds,
      lattice: {
        scheme: caseData.latticeModel || "D2Q9",
        nx,
        ny,
        nz
      }
    },
    entities,
    annotations: [],
    fields: [],
    view: { preset: is3D ? "iso" : "xy" }
  };
}
