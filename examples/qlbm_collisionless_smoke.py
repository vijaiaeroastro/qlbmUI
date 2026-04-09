from pathlib import Path
import os

from qiskit_aer import AerSimulator
from qlbm.components import (
    CQLBM,
    CollisionlessInitialConditions,
    EmptyPrimitive,
    GridMeasurement,
)
from qlbm.infra import QiskitRunner, SimulationConfig
from qlbm.lattice import CollisionlessLattice
from qlbm.tools.utils import create_directory_and_parents


def main() -> None:
    output_dir = Path(os.environ.get("QLBM_OUTPUT_DIR", "./qlbm-output-smoke"))
    create_directory_and_parents(str(output_dir))

    lattice = CollisionlessLattice(
        {
            "lattice": {"dim": {"x": 8, "y": 8}, "velocities": {"x": 4, "y": 4}},
            "geometry": [],
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
    runner.run(1, 2**8, str(output_dir), statevector_snapshots=True)
    print(f"qlbm collisionless run completed: {output_dir}")


if __name__ == "__main__":
    main()
