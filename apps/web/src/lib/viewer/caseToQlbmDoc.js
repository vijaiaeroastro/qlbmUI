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

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeDirectionTag(direction) {
  return String(direction || "").toLowerCase();
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

function seedRegionBounds(caseData, is3D, nz) {
  const region = caseData.initialConditions?.region || {};
  const xMin = Number(region.xMin) || 0;
  const xMax = Number(region.xMax) || 0;
  const yMin = Number(region.yMin) || 0;
  const yMax = Number(region.yMax) || 0;
  const zMin = is3D ? Number(region.zMin) || 0 : 0;
  const zMax = is3D ? Number(region.zMax) || 0 : 0;

  if (xMax < xMin || yMax < yMin || (is3D && zMax < zMin)) {
    return null;
  }

  return { xMin, xMax, yMin, yMax, zMin, zMax };
}

function seedRegionEntity(caseData, is3D, nz) {
  const bounds = seedRegionBounds(caseData, is3D, nz);
  if (!bounds) return null;

  const xSize = Math.max(bounds.xMax - bounds.xMin + 1, 1);
  const ySize = Math.max(bounds.yMax - bounds.yMin + 1, 1);
  const zSize = is3D ? Math.max(bounds.zMax - bounds.zMin + 1, 1) : 1;

  return {
    id: "seed-region",
    kind: "region.box",
    name: "Seed Region",
    params: {
      center: [
        bounds.xMin + xSize / 2,
        bounds.yMin + ySize / 2,
        is3D ? bounds.zMin + zSize / 2 : 0.5
      ],
      size: [xSize, ySize, zSize]
    },
    tags: unique(["seed", caseData.initialConditions?.preset || "uniform", ...((caseData.initialConditions?.directions || []).map(normalizeDirectionTag))])
  };
}

function directionGlyphEntity(caseData, is3D, nz) {
  const preset = caseData.initialConditions?.preset || "uniform";
  if (preset !== "directional-inlet" && preset !== "point") {
    return null;
  }

  const directions = unique((caseData.initialConditions?.directions || []).map((direction) => String(direction || "").toUpperCase()).filter(Boolean));
  if (!directions.length) return null;

  const bounds = seedRegionBounds(caseData, is3D, nz);
  if (!bounds) return null;

  return {
    id: "initial-direction-glyphs",
    kind: "glyph.directionSet",
    name: "Initial Condition Directions",
    params: {
      bounds: [
        [bounds.xMin, bounds.yMin, is3D ? bounds.zMin : 0],
        [bounds.xMax + 1, bounds.yMax + 1, is3D ? bounds.zMax + 1 : 1]
      ],
      directions
    },
    tags: unique(["initial-condition", preset, ...directions.map(normalizeDirectionTag)])
  };
}

export function getVisibleFacesForCase(caseData) {
  const is3D = caseData.dimension === "3D";
  const { nx, ny, nz } = domainBounds(caseData);
  const bounds = seedRegionBounds(caseData, is3D, nz);
  if (!bounds) return [];

  const faces = [];
  if (bounds.xMin <= 0) faces.push("xmin");
  if (bounds.xMax >= nx - 1) faces.push("xmax");
  if (bounds.yMin <= 0) faces.push("ymin");
  if (bounds.yMax >= ny - 1) faces.push("ymax");
  if (is3D) {
    if (bounds.zMin <= 0) faces.push("zmin");
    if (bounds.zMax >= nz - 1) faces.push("zmax");
  }
  return unique(faces);
}

function inletBoundaryEntities(caseData) {
  const preset = caseData.initialConditions?.preset || "uniform";
  const directions = caseData.initialConditions?.directions || [];
  const visibleFaces = getVisibleFacesForCase(caseData);
  if (!visibleFaces.length) return [];

  const faceTag = preset === "directional-inlet" ? "velocity-inlet" : "seed-face";
  return visibleFaces.map((face) => ({
    id: `seed-face-${face}`,
    kind: "boundary.patch",
    name: preset === "directional-inlet" ? `Inlet ${face}` : `Seed Face ${face}`,
    params: { face },
    tags: unique([faceTag, preset, ...directions.map(normalizeDirectionTag)])
  }));
}

function initialConditionAnnotations(caseData) {
  const preset = caseData.initialConditions?.preset || "uniform";
  const directions = caseData.initialConditions?.directions || [];
  return [
    {
      id: "initial-condition-meta",
      kind: "initial-condition",
      name: "Initial Condition",
      params: {
        preset,
        directions,
        visibleFaces: getVisibleFacesForCase(caseData)
      },
      tags: unique(["initial-condition", preset, ...directions.map(normalizeDirectionTag)])
    }
  ];
}

export function caseToQlbmDoc(caseData) {
  const is3D = caseData.dimension === "3D";
  const { nx, ny, nz, bounds } = domainBounds(caseData);

  const entities = [];
  const seed = seedRegionEntity(caseData, is3D, nz);
  if (seed) entities.push(seed);
  const directionGlyphs = directionGlyphEntity(caseData, is3D, nz);
  if (directionGlyphs) entities.push(directionGlyphs);
  entities.push(...inletBoundaryEntities(caseData));
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
    annotations: initialConditionAnnotations(caseData),
    fields: [],
    view: { preset: is3D ? "iso" : "xy" }
  };
}
