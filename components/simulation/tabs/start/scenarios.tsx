import WorldObject from "@/simulation/world/objects/WorldObject";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import EllipseReproductionArea from "@/simulation/world/areas/reproduction/EllipseReproductionArea";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import RectangleObject from "@/simulation/world/objects/RectangleObject";
import EllipseObject from "@/simulation/world/objects/EllipseObject";
import SavedWorldInitialValues from "@/simulation/serialization/data/SavedWorldInitialValues";


// TODO implement missing objects - Health

type SavedScenario = {
  worldInitialValues: SavedWorldInitialValues,
  // simulation parameters
  currentGen: number;
  currentStep: number;
  pauseBetweenSteps: number;
  immediateSteps: number;
  deletionRatio: number;
  pauseBetweenGenerations: number;
  
}

type ScenarioObjects = {
  name: string,
  data: SavedScenario
}

export const scenarioObjects : ScenarioObjects[] = [];

const scenarioData1 : SavedScenario= {"worldInitialValues":{"size":100,"selectionMethod":"InsideReproductionAreaSelection","populationStrategy":"AsexualRandomPopulation","stepsPerGen":300,"initialPopulation":500,"initialGenomeSize":4,"maxGenomeSize":30,"maxNumberNeurons":15,"mutationMode":"wholeGene","mutationProbability":0.05,"geneInsertionDeletionProbability":0.015,"enabledSensors":["HorizontalPosition","VerticalPosition","Age","Oscillator","Random","HorizontalSpeed","VerticalSpeed","HorizontalBorderDistance","VerticalBorderDistance","BorderDistance","Mass"],"enabledActions":["MoveNorth","MoveSouth","MoveEast","MoveWest","RandomMove","MoveForward","Photosynthesis"],"worldObjects":[{"data":{"x":0.1,"y":0.1,"width":0.2,"height":0.2,"relative":true},"type":"RectangleSpawnArea"},{"data":{"x":0.3,"y":0.6,"width":0.2,"height":0.4,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0.1,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.3,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.5,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.7,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.9,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}]},"currentGen":96,"currentStep":158,"pauseBetweenSteps":0,"immediateSteps":1,"deletionRatio":0.5,"pauseBetweenGenerations":0};

scenarioObjects.push({name: "scenario1", data: scenarioData1});
scenarioObjects.push({name: "scenario2", data: scenarioData1});
scenarioObjects.push({name: "scenario3", data: scenarioData1});
