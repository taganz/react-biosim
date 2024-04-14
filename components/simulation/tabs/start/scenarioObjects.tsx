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

const scenarioData1 : SavedScenario = {"worldInitialValues":{"size":100,"selectionMethod":"InsideReproductionAreaSelection","populationStrategy":"AsexualRandomPopulation","stepsPerGen":300,"initialPopulation":500,"initialGenomeSize":4,"maxGenomeSize":30,"maxNumberNeurons":15,"mutationMode":"wholeGene","mutationProbability":0.05,"geneInsertionDeletionProbability":0.015,"enabledSensors":["HorizontalPosition","VerticalPosition","Age","Oscillator","Random","HorizontalSpeed","VerticalSpeed","HorizontalBorderDistance","VerticalBorderDistance","BorderDistance","Mass"],"enabledActions":["MoveNorth","MoveSouth","MoveEast","MoveWest","RandomMove","MoveForward","Photosynthesis"],"worldObjects":[{"data":{"x":0.1,"y":0.1,"width":0.2,"height":0.2,"relative":true},"type":"RectangleSpawnArea"},{"data":{"x":0.3,"y":0.6,"width":0.2,"height":0.4,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0.1,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.3,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.5,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.7,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.9,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}]},"currentGen":96,"currentStep":158,"pauseBetweenSteps":0,"immediateSteps":1,"deletionRatio":0.5,"pauseBetweenGenerations":0};
scenarioObjects.push({name: "vertical boxes", data: scenarioData1});

const scenarioData2 : SavedScenario = {"worldInitialValues":{"size":100,"selectionMethod":"InsideReproductionAreaSelection","populationStrategy":"AsexualZonePopulation","stepsPerGen":300,"initialPopulation":500,"initialGenomeSize":4,"maxGenomeSize":30,"maxNumberNeurons":15,"mutationMode":"wholeGene","mutationProbability":0.05,"geneInsertionDeletionProbability":0.015,"enabledSensors":["HorizontalPosition","VerticalPosition","Age","Oscillator","Random","HorizontalSpeed","VerticalSpeed","HorizontalBorderDistance","VerticalBorderDistance","BorderDistance","Mass"],"enabledActions":["MoveNorth","MoveSouth","MoveEast","MoveWest","RandomMove","MoveForward","Photosynthesis"],"worldObjects":[{"data":{"x":0,"y":0,"width":0.43,"height":0.33,"relative":true},"type":"RectangleSpawnArea"},{"data":{"x":0,"y":0.61,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.04,"y":0.75,"width":0.48000000000000004,"height":0.26,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0.98,"y":0.41,"width":0.44999999999999996,"height":0.26,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0.77,"y":0.97,"width":0.47,"height":0.030000000000000027,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0.97,"y":-0.01,"width":0.030000000000000027,"height":0.24,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0,"y":0.36,"width":0.6,"height":0.07,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}]},"currentGen":24,"currentStep":273,"pauseBetweenSteps":0,"immediateSteps":1,"deletionRatio":0.5,"pauseBetweenGenerations":0};
scenarioObjects.push({name: "turn right", data: scenarioData2});

const scenarioData3 : SavedScenario = {"worldInitialValues":{"size":100,"selectionMethod":"InsideReproductionAreaSelection","populationStrategy":"AsexualRandomPopulation","stepsPerGen":300,"initialPopulation":500,"initialGenomeSize":4,"maxGenomeSize":30,"maxNumberNeurons":15,"mutationMode":"wholeGene","mutationProbability":0.05,"geneInsertionDeletionProbability":0.015,"enabledSensors":["HorizontalPosition","VerticalPosition","Age","Oscillator","Random","HorizontalSpeed","VerticalSpeed","HorizontalBorderDistance","VerticalBorderDistance","BorderDistance","Mass"],"enabledActions":["MoveNorth","MoveSouth","MoveEast","MoveWest","RandomMove","MoveForward","Photosynthesis"],"worldObjects":[{"data":{"x":0.25,"y":0.25,"width":0.5,"height":0.5,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0,"y":0,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.2,"y":0.2,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.4,"y":0.4,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.6,"y":0.6,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.8,"y":0.8,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}]}, "currentGen":24,"currentStep":273,"pauseBetweenSteps":0,"immediateSteps":1,"deletionRatio":0.5,"pauseBetweenGenerations":0};
scenarioObjects.push({name: "Carlos' original", data: scenarioData3});
