import vtkGenericRenderWindow from "@kitware/vtk.js/Rendering/Misc/GenericRenderWindow";
import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor";
import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";
import vtkAxesActor from "@kitware/vtk.js/Rendering/Core/AxesActor";
import vtkSTLReader from "@kitware/vtk.js/IO/Geometry/STLReader";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkXMLImageDataReader from "@kitware/vtk.js/IO/XML/XMLImageDataReader";
import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";
import { SlicingMode } from "@kitware/vtk.js/Rendering/Core/ImageMapper/Constants";

function createOrientationWidget(interactor) {
  const cube = vtkAnnotatedCubeActor.newInstance();
  cube.setDefaultStyle({
    text: "+X",
    fontStyle: "bold",
    fontFamily: "Arial",
    faceColor: "#0d8b8b",
    edgeThickness: 0.1,
    edgeColor: "#f7f2ea",
    resolution: 200
  });
  cube.setXPlusFaceProperty({ text: "+X", faceColor: "#0d8b8b" });
  cube.setXMinusFaceProperty({ text: "-X", faceColor: "#df7b33" });
  cube.setYPlusFaceProperty({ text: "+Y", faceColor: "#2a6f9b" });
  cube.setYMinusFaceProperty({ text: "-Y", faceColor: "#7e5a9b" });
  cube.setZPlusFaceProperty({ text: "+Z", faceColor: "#2c8c61" });
  cube.setZMinusFaceProperty({ text: "-Z", faceColor: "#9e4f43" });

  const widget = vtkOrientationMarkerWidget.newInstance({
    actor: cube,
    interactor
  });
  widget.setEnabled(true);
  widget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT);
  widget.setViewportSize(0.16);
  widget.setMinPixelSize(100);
  widget.setMaxPixelSize(220);
  return widget;
}

async function addStl(renderer, url) {
  const reader = vtkSTLReader.newInstance();
  await reader.setUrl(url, { binary: true });
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(reader.getOutputPort());

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().setColor(0.22, 0.31, 0.38);
  actor.getProperty().setOpacity(0.95);
  renderer.addActor(actor);
}

async function addVti(renderer, url) {
  const reader = vtkXMLImageDataReader.newInstance();
  await reader.setUrl(url);
  const imageData = reader.getOutputData();
  const extent = imageData.getExtent();

  const mapper = vtkImageMapper.newInstance();
  mapper.setInputData(imageData);
  mapper.setSlicingMode(SlicingMode.K);
  mapper.setSlice(Math.floor((extent[4] + extent[5]) / 2));

  const slice = vtkImageSlice.newInstance();
  slice.setMapper(mapper);
  renderer.addViewProp(slice);
}

export async function createResultsScene(container, imageArtifact, geometryArtifacts) {
  const generic = vtkGenericRenderWindow.newInstance({
    background: [0.965, 0.95, 0.91]
  });

  generic.setContainer(container);
  generic.resize();

  const renderer = generic.getRenderer();
  const renderWindow = generic.getRenderWindow();
  const interactor = generic.getInteractor();

  const axes = vtkAxesActor.newInstance();
  axes.setTotalLength(1.2, 1.2, 1.2);
  renderer.addActor(axes);

  const orientationWidget = createOrientationWidget(interactor);

  try {
    if (imageArtifact) {
      await addVti(renderer, imageArtifact.url);
    }
    for (const item of geometryArtifacts) {
      await addStl(renderer, item.url);
    }
  } catch (error) {
    console.error("Failed to load vtk.js artifacts", error);
  }

  renderer.resetCamera();
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
