function geometryLinesFromCase(caseData) {
  return caseData.objects
    .filter((item) => item.type === "cuboid")
    .map((item) => {
      const x0 = Math.round(item.position.x);
      const y0 = Math.round(item.position.y);
      const w = Math.max(1, Math.round(item.size.width ?? 1));
      const h = Math.max(1, Math.round(item.size.height ?? 1));
      return `        {"shape": "cuboid", "x": [${x0}, ${x0 + w}], "y": [${y0}, ${y0 + h}], "boundary": "${item.boundary}"},`;
    })
    .join("\n");
}

export function generateQlBmScript(caseData) {
  const geometry = geometryLinesFromCase(caseData);
  const x = Number(caseData.grid.x) || 8;
  const y = Number(caseData.grid.y) || 8;
  const steps = Number(caseData.simulation.timeSteps) || 1;
  const shots = Number(caseData.simulation.shots) || 256;

  return `from pathlib import Path
import os

from qiskit_aer import AerSimulator
from qlbm.components import CQLBM, CollisionlessInitialConditions, EmptyPrimitive, GridMeasurement
from qlbm.infra import QiskitRunner, SimulationConfig
from qlbm.lattice import CollisionlessLattice
from qlbm.tools.utils import create_directory_and_parents

output_dir = Path(os.environ["QLBM_OUTPUT_DIR"])
create_directory_and_parents(str(output_dir))

lattice = CollisionlessLattice(
    {
        "lattice": {"dim": {"x": ${x}, "y": ${y}}, "velocities": {"x": 4, "y": 4}},
        "geometry": [
${geometry || "            "}
        ],
    }
)

cfg = SimulationConfig(
    initial_conditions=CollisionlessInitialConditions(lattice),
    algorithm=CQLBM(lattice),
    postprocessing=EmptyPrimitive(lattice),
    measurement=GridMeasurement(lattice),
    target_platform="QISKIT",
    compiler_platform="QISKIT",
    optimization_level=0,
    statevector_sampling=True,
    execution_backend=AerSimulator(method="statevector"),
    sampling_backend=AerSimulator(method="statevector"),
)

cfg.prepare_for_simulation()
runner = QiskitRunner(cfg, lattice)
runner.run(${steps}, ${shots}, str(output_dir), statevector_snapshots=True)
print("qlbm run completed", output_dir, flush=True)
`;
}
