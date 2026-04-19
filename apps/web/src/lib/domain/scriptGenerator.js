function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function latticeDimensionBlock(caseData) {
  if (caseData.dimension === "3D") {
    return `"dim": {"x": ${Number(caseData.grid.x) || 8}, "y": ${Number(caseData.grid.y) || 8}, "z": ${Number(caseData.grid.z) || 8}}`;
  }

  return `"dim": {"x": ${Number(caseData.grid.x) || 8}, "y": ${Number(caseData.grid.y) || 8}}`;
}

function latticeVelocityBlock(caseData) {
  if (caseData.dimension === "3D") {
    return `"velocities": {"x": 4, "y": 4, "z": 4}`;
  }

  return `"velocities": {"x": 4, "y": 4}`;
}

function cuboidGeometryLine(item, caseData) {
  const side = Math.max(1, Math.round(item.size.width ?? item.size.height ?? item.size.depth ?? 1));
  const cx = Number(item.position.x) || 0;
  const cy = Number(item.position.y) || 0;
  const cz = Number(item.position.z) || 0;
  const xDim = Math.max(2, Number(caseData.grid.x) || 8);
  const yDim = Math.max(2, Number(caseData.grid.y) || 8);
  const zDim = Math.max(2, Number(caseData.grid.z) || 8);
  const x0 = clamp(Math.round(cx - side / 2), 0, xDim - 1);
  const y0 = clamp(Math.round(cy - side / 2), 0, yDim - 1);
  const x1 = clamp(x0 + side, x0 + 1, xDim);
  const y1 = clamp(y0 + side, y0 + 1, yDim);

  if (caseData.dimension === "3D") {
    const z0 = clamp(Math.round(cz - side / 2), 0, zDim - 1);
    const z1 = clamp(z0 + side, z0 + 1, zDim);
    return `        {"shape": "cuboid", "x": [${x0}, ${x1}], "y": [${y0}, ${y1}], "z": [${z0}, ${z1}], "boundary": "${item.boundary}"},`;
  }

  return `        {"shape": "cuboid", "x": [${x0}, ${x1}], "y": [${y0}, ${y1}], "boundary": "${item.boundary}"},`;
}

function geometryLinesFromCase(caseData) {
  return caseData.objects
    .filter((item) => item.type === "cuboid")
    .map((item) => cuboidGeometryLine(item, caseData))
    .join("\n");
}

export function generateQlBmScript(caseData) {
  const geometry = geometryLinesFromCase(caseData);
  const steps = Math.max(1, Number(caseData.simulation.timeSteps) || 1);
  const shots = Math.max(1, Number(caseData.simulation.shots) || 256);

  return `from pathlib import Path
import os

from qiskit_aer import AerSimulator

try:
    from qlbm.components import EmptyPrimitive, GridMeasurement, MSInitialConditions, MSQLBM
    from qlbm.infra.runner import QiskitRunner, SimulationConfig
    from qlbm.lattice import MSLattice

    lattice_factory = MSLattice
    initial_conditions_factory = MSInitialConditions
    algorithm_factory = MSQLBM
except ImportError:
    from qlbm.components import CQLBM, CollisionlessInitialConditions, EmptyPrimitive, GridMeasurement
    from qlbm.infra import QiskitRunner, SimulationConfig
    from qlbm.lattice import CollisionlessLattice

    lattice_factory = CollisionlessLattice
    initial_conditions_factory = CollisionlessInitialConditions
    algorithm_factory = CQLBM

output_dir = Path(os.environ["QLBM_OUTPUT_DIR"])
output_dir.mkdir(parents=True, exist_ok=True)

lattice = lattice_factory(
    {
        "lattice": {${latticeDimensionBlock(caseData)}, ${latticeVelocityBlock(caseData)}},
        "geometry": [
${geometry || "            "}
        ],
    }
)

cfg = SimulationConfig(
    initial_conditions=initial_conditions_factory(lattice),
    algorithm=algorithm_factory(lattice),
    postprocessing=EmptyPrimitive(lattice),
    measurement=GridMeasurement(lattice),
    target_platform="QISKIT",
    compiler_platform="QISKIT",
    optimization_level=0,
    statevector_sampling=True,
    execution_backend=AerSimulator(method="statevector"),
    sampling_backend=AerSimulator(method="statevector"),
)

cfg.validate()
cfg.prepare_for_simulation()

runner = QiskitRunner(cfg, lattice)
runner.run(${steps}, ${shots}, str(output_dir), statevector_snapshots=True)
print("qlbm run completed", output_dir, flush=True)
`;
}
