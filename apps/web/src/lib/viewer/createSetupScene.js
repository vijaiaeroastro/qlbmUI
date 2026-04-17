import vtkGenericRenderWindow from "@kitware/vtk.js/Rendering/Misc/GenericRenderWindow";
import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor";
import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";
import vtkAxesActor from "@kitware/vtk.js/Rendering/Core/AxesActor";
import vtkCubeSource from "@kitware/vtk.js/Filters/Sources/CubeSource";
import vtkSphereSource from "@kitware/vtk.js/Filters/Sources/SphereSource";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";

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

function createDomainActor(caseData) {
  const depth = caseData.dimension === "3D" ? Math.max(caseData.grid.z, 1) : 0.2;
  const source = vtkCubeSource.newInstance({
    xLength: Math.max(caseData.grid.x, 1),
    yLength: Math.max(caseData.grid.y, 1),
    zLength: depth,
    center: [caseData.grid.x / 2, caseData.grid.y / 2, caseData.dimension === "3D" ? depth / 2 : 0]
  });

  const actor = makeActor(source, [0.33, 0.43, 0.52], 1);
  actor.getProperty().setRepresentationToWireframe();
  actor.getProperty().setLineWidth(1.5);
  return actor;
}

function createObjectActor(item, dimension) {
  if (item.type === "sphere") {
    const radius = Math.max(item.size.radius ?? 1, 1);
    const source = vtkSphereSource.newInstance({
      radius,
      thetaResolution: 36,
      phiResolution: 24,
      center: [
        item.position.x,
        item.position.y,
        dimension === "3D" ? item.position.z : 0
      ]
    });
    const actor = makeActor(source, [0.09, 0.49, 0.56], 0.85);
    actor.getProperty().setEdgeVisibility(true);
    actor.getProperty().setEdgeColor(0.05, 0.29, 0.33);
    return actor;
  }

  const depth = dimension === "3D" ? Math.max(item.size.depth ?? 1, 1) : 0.2;
  const source = vtkCubeSource.newInstance({
    xLength: Math.max(item.size.width ?? 1, 1),
    yLength: Math.max(item.size.height ?? 1, 1),
    zLength: depth,
    center: [
      item.position.x,
      item.position.y,
      dimension === "3D" ? item.position.z : 0
    ]
  });

  const actor = makeActor(source, [0.09, 0.49, 0.56], 0.85);
  actor.getProperty().setEdgeVisibility(true);
  actor.getProperty().setEdgeColor(0.05, 0.29, 0.33);
  return actor;
}

export function createSetupScene(container, caseData) {
  const generic = vtkGenericRenderWindow.newInstance({
    background: [0.94, 0.96, 0.98]
  });

  generic.setContainer(container);
  generic.resize();

  const renderer = generic.getRenderer();
  const renderWindow = generic.getRenderWindow();
  const interactor = generic.getInteractor();

  renderer.addActor(createDomainActor(caseData));

  for (const item of caseData.objects) {
    renderer.addActor(createObjectActor(item, caseData.dimension));
  }

  const axes = vtkAxesActor.newInstance();
  axes.setTotalLength(1.4, 1.4, 1.4);
  renderer.addActor(axes);

  const orientationWidget = createOrientationWidget(interactor);

  renderer.resetCamera();

  if (caseData.dimension !== "3D") {
    const camera = renderer.getActiveCamera();
    camera.setPosition(caseData.grid.x / 2, caseData.grid.y / 2, Math.max(caseData.grid.x, caseData.grid.y) * 2.2);
    camera.setFocalPoint(caseData.grid.x / 2, caseData.grid.y / 2, 0);
    camera.setViewUp(0, 1, 0);
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
