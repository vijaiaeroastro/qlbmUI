import vtkGenericRenderWindow from "@kitware/vtk.js/Rendering/Misc/GenericRenderWindow";
import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor";
import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";
import vtkAxesActor from "@kitware/vtk.js/Rendering/Core/AxesActor";
import vtkCubeSource from "@kitware/vtk.js/Filters/Sources/CubeSource";
import vtkSphereSource from "@kitware/vtk.js/Filters/Sources/SphereSource";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";

const PLANAR_DEPTH = 0.08;

function createOrientationWidget(interactor) {
  const cube = vtkAnnotatedCubeActor.newInstance();
  cube.setDefaultStyle({
    fontStyle: "bold",
    fontFamily: "Arial",
    edgeThickness: 0.12,
    edgeColor: "#f4f7fa",
    faceColor: "#0f7c8f"
  });
  cube.setXPlusFaceProperty({ text: "+X", faceColor: "#0f7c8f" });
  cube.setXMinusFaceProperty({ text: "-X", faceColor: "#d98b2b" });
  cube.setYPlusFaceProperty({ text: "+Y", faceColor: "#2d6f9a" });
  cube.setYMinusFaceProperty({ text: "-Y", faceColor: "#6f5b9a" });
  cube.setZPlusFaceProperty({ text: "+Z", faceColor: "#2f7a46" });
  cube.setZMinusFaceProperty({ text: "-Z", faceColor: "#9e5346" });

  const widget = vtkOrientationMarkerWidget.newInstance({
    actor: cube,
    interactor
  });
  widget.setEnabled(true);
  widget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT);
  widget.setViewportSize(0.16);
  widget.setMinPixelSize(90);
  widget.setMaxPixelSize(220);
  return widget;
}

function makeActor(source, color, opacity = 1) {
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(source.getOutputPort());
  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().setColor(...color);
  actor.getProperty().setOpacity(opacity);
  return actor;
}

function safeExtent(value) {
  return Math.max(Number(value) || 1, 1);
}

function clampRegionValue(value, max) {
  return Math.min(Math.max(Number(value) || 0, 0), max);
}

function createDomainActors(caseData) {
  const depth = caseData.dimension === "3D" ? safeExtent(caseData.grid.z) : PLANAR_DEPTH;
  const source = vtkCubeSource.newInstance({
    xLength: safeExtent(caseData.grid.x),
    yLength: safeExtent(caseData.grid.y),
    zLength: depth,
    center: [safeExtent(caseData.grid.x) / 2, safeExtent(caseData.grid.y) / 2, caseData.dimension === "3D" ? depth / 2 : 0]
  });

  const fillActor = makeActor(source, caseData.dimension === "3D" ? [0.8, 0.88, 0.97] : [0.9, 0.95, 0.99], caseData.dimension === "3D" ? 0.15 : 0.3);
  fillActor.getProperty().setEdgeVisibility(false);

  const outlineActor = makeActor(source, [0.29, 0.41, 0.54], 1);
  outlineActor.getProperty().setRepresentationToWireframe();
  outlineActor.getProperty().setLineWidth(caseData.dimension === "3D" ? 1.5 : 2);

  return [fillActor, outlineActor];
}

function createSeedRegionActor(caseData) {
  const region = caseData.initialConditions?.region || {};
  const xMin = clampRegionValue(region.xMin, safeExtent(caseData.grid.x));
  const xMax = clampRegionValue(region.xMax, safeExtent(caseData.grid.x));
  const yMin = clampRegionValue(region.yMin, safeExtent(caseData.grid.y));
  const yMax = clampRegionValue(region.yMax, safeExtent(caseData.grid.y));
  const zMin = caseData.dimension === "3D" ? clampRegionValue(region.zMin, safeExtent(caseData.grid.z)) : 0;
  const zMax = caseData.dimension === "3D" ? clampRegionValue(region.zMax, safeExtent(caseData.grid.z)) : PLANAR_DEPTH;

  const xLength = Math.max(Math.abs(xMax - xMin) + 1, 0.6);
  const yLength = Math.max(Math.abs(yMax - yMin) + 1, 0.6);
  const zLength = caseData.dimension === "3D" ? Math.max(Math.abs(zMax - zMin) + 1, 0.6) : PLANAR_DEPTH;

  const source = vtkCubeSource.newInstance({
    xLength,
    yLength,
    zLength,
    center: [
      Math.min(xMin, xMax) + xLength / 2,
      Math.min(yMin, yMax) + yLength / 2,
      caseData.dimension === "3D" ? Math.min(zMin, zMax) + zLength / 2 : 0
    ]
  });

  const actor = makeActor(source, [0.11, 0.67, 0.85], caseData.dimension === "3D" ? 0.16 : 0.22);
  actor.getProperty().setEdgeVisibility(true);
  actor.getProperty().setEdgeColor(0.08, 0.52, 0.65);
  actor.getProperty().setLineWidth(1.3);
  return actor;
}

function createObjectActor(item, dimension) {
  if (item.type === "sphere") {
    const radius = safeExtent(item.size.radius);
    const source = vtkSphereSource.newInstance({
      radius,
      thetaResolution: dimension === "3D" ? 36 : 48,
      phiResolution: dimension === "3D" ? 24 : 6,
      center: [
        item.position.x,
        item.position.y,
        dimension === "3D" ? item.position.z : 0
      ]
    });
    const actor = makeActor(source, [0.9, 0.43, 0.16], dimension === "3D" ? 0.75 : 0.9);
    actor.getProperty().setEdgeVisibility(true);
    actor.getProperty().setEdgeColor(0.56, 0.24, 0.07);
    return actor;
  }

  const depth = dimension === "3D" ? safeExtent(item.size.depth) : PLANAR_DEPTH;
  const source = vtkCubeSource.newInstance({
    xLength: safeExtent(item.size.width),
    yLength: safeExtent(item.size.height),
    zLength: depth,
    center: [
      item.position.x,
      item.position.y,
      dimension === "3D" ? item.position.z : 0
    ]
  });

  const actor = makeActor(source, [0.9, 0.43, 0.16], dimension === "3D" ? 0.72 : 0.86);
  actor.getProperty().setEdgeVisibility(true);
  actor.getProperty().setEdgeColor(0.56, 0.24, 0.07);
  return actor;
}

export function createSetupScene(container, caseData) {
  const generic = vtkGenericRenderWindow.newInstance({
    background: [0.975, 0.985, 0.995]
  });

  generic.setContainer(container);
  generic.resize();

  const renderer = generic.getRenderer();
  const renderWindow = generic.getRenderWindow();
  const interactor = generic.getInteractor();

  for (const actor of createDomainActors(caseData)) {
    renderer.addActor(actor);
  }

  renderer.addActor(createSeedRegionActor(caseData));

  for (const item of caseData.objects) {
    renderer.addActor(createObjectActor(item, caseData.dimension));
  }

  const axes = vtkAxesActor.newInstance();
  axes.setTotalLength(
    Math.max(safeExtent(caseData.grid.x) * 0.16, 1.4),
    Math.max(safeExtent(caseData.grid.y) * 0.16, 1.4),
    caseData.dimension === "3D" ? Math.max(safeExtent(caseData.grid.z) * 0.16, 1.4) : 0.01
  );
  renderer.addActor(axes);

  const orientationWidget = createOrientationWidget(interactor);

  renderer.resetCamera();

  if (caseData.dimension !== "3D") {
    const camera = renderer.getActiveCamera();
    camera.setParallelProjection(true);
    camera.setPosition(safeExtent(caseData.grid.x) / 2, safeExtent(caseData.grid.y) / 2, Math.max(safeExtent(caseData.grid.x), safeExtent(caseData.grid.y)) * 2.6);
    camera.setFocalPoint(safeExtent(caseData.grid.x) / 2, safeExtent(caseData.grid.y) / 2, 0);
    camera.setViewUp(0, 1, 0);
    camera.setParallelScale(Math.max(safeExtent(caseData.grid.x), safeExtent(caseData.grid.y)) * 0.58);
    renderer.resetCameraClippingRange();
  } else {
    const camera = renderer.getActiveCamera();
    camera.azimuth(28);
    camera.elevation(20);
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
  }

  renderWindow.render();

  const resizeObserver = new ResizeObserver(() => {
    generic.resize();
  });
  resizeObserver.observe(container);

  return {
    destroy() {
      resizeObserver.disconnect();
      orientationWidget.delete();
      generic.delete();
    }
  };
}
