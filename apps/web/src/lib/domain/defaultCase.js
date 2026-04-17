function makeObject(index, type = "cuboid") {
  return {
    id: `object-${index}`,
    name: `Object ${index}`,
    type,
    boundary: "bounceback",
    position: { x: 2 * index, y: 2 * index, z: 0 },
    size:
      type === "sphere"
        ? { radius: 2 }
        : { width: 3, height: 3, depth: 3 }
  };
}

export function createDefaultCase() {
  return {
    name: "Untitled Project",
    notes: "",
    dimension: "2D",
    latticeFamily: "collisionless",
    latticeModel: "D2Q9",
    grid: { x: 16, y: 16, z: 8 },
    initialConditions: {
      preset: "uniform",
      directions: ["E"],
      region: { xMin: 0, xMax: 3, yMin: 0, yMax: 15, zMin: 0, zMax: 0 }
    },
    objects: [makeObject(1, "cuboid")],
    simulation: {
      timeSteps: 5,
      shots: 256
    }
  };
}

export function createProjectNameFromRun(run) {
  return run?.case_name || run?.run_id || "Untitled Project";
}
