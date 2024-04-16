import SavedWorldGenerationData from "@/simulation/serialization/data/SavedWorldGenerationData";
import SavedWorldControllerData from "@/simulation/serialization/data/SavedWorldControllerData";
import SavedWorld from '@/simulation/serialization/data/SavedWorld';


// TODO implement missing objects - Health


/*
export type SavedScenario = {
  worldGenerationData: SavedWorldGenerationData,
  worldControllerData: SavedWorldControllerData
}
*/

type ScenarioObjects = {
  name: string,
  data: string
}

export const scenarioObjects : ScenarioObjects[] = [];

const scenarioData1  = '{"worldGenerationData":{"populationStrategy":"AsexualRandomPopulation","selectionMethod":"InsideReproductionAreaSelection","initialPopulation":500,"initialGenomeSize":4,"maxGenomeSize":30,"maxNumberNeurons":15,"mutationMode":"wholeGene","mutationProbability":0.05,"deletionRatio":0.5,"geneInsertionDeletionProbability":0.015,"enabledSensors":["HorizontalPosition","VerticalPosition","Age","Oscillator","Random","HorizontalSpeed","VerticalSpeed","HorizontalBorderDistance","VerticalBorderDistance","BorderDistance","Mass"],"enabledActions":["MoveNorth","MoveSouth","MoveEast","MoveWest","RandomMove","MoveForward","Photosynthesis"],"lastCreatureIdCreated":500,"lastCreatureCount":500,"lastSurvivorsCount":67,"lastFitnessMaxValue":13.4,"lastSurvivalRate":0.134},"worldControllerData":{"size":100,"stepsPerGen":300,"initialPopulation":500,"worldObjects":[{"data":{"x":0.1,"y":0.1,"width":0.2,"height":0.2,"relative":true},"type":"RectangleSpawnArea"},{"data":{"x":0.3,"y":0.6,"width":0.2,"height":0.4,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0.1,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.3,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.5,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.7,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.9,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}],"pauseBetweenSteps":0,"immediateSteps":1,"pauseBetweenGenerations":0,"currentGen":4,"currentStep":138,"lastGenerationDuration":1761,"totalTime":7422}}';
scenarioObjects.push({name: "vertical boxes", data: scenarioData1});

const scenarioData2 = '{"worldGenerationData":{"populationStrategy":"AsexualZonePopulation","selectionMethod":"InsideReproductionAreaSelection","initialPopulation":500,"initialGenomeSize":4,"maxGenomeSize":30,"maxNumberNeurons":15,"mutationMode":"wholeGene","mutationProbability":0.05,"deletionRatio":0.5,"geneInsertionDeletionProbability":0.015,"enabledSensors":["HorizontalPosition","VerticalPosition","Age","Oscillator","Random","HorizontalSpeed","VerticalSpeed","HorizontalBorderDistance","VerticalBorderDistance","BorderDistance","Mass"],"enabledActions":["MoveNorth","MoveSouth","MoveEast","MoveWest","RandomMove","MoveForward","Photosynthesis"],"lastCreatureIdCreated":500,"lastCreatureCount":500,"lastSurvivorsCount":31,"lastFitnessMaxValue":6.2,"lastSurvivalRate":0.062},"worldControllerData":{"size":100,"stepsPerGen":300,"initialPopulation":500,"worldObjects":[{"data":{"x":-0.02,"y":0.65,"width":0.55,"height":0.36,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0,"y":0,"width":0.58,"height":0.33,"relative":true},"type":"RectangleSpawnArea"},{"data":{"x":0.96,"y":0.24,"width":0.06999999999999995,"height":0.42,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0,"y":0.37,"width":0.61,"height":0.12,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}],"pauseBetweenSteps":0,"immediateSteps":1,"pauseBetweenGenerations":0,"currentGen":4,"currentStep":263,"lastGenerationDuration":1094,"totalTime":5468}}';
scenarioObjects.push({name: "turn right", data: scenarioData2});


const scenarioDataCarlos = '{"worldGenerationData":{"populationStrategy":"AsexualRandomPopulation","selectionMethod":"InsideReproductionAreaSelection","initialPopulation":500,"initialGenomeSize":4,"maxGenomeSize":30,"maxNumberNeurons":15,"mutationMode":"wholeGene","mutationProbability":0.05,"deletionRatio":0.5,"geneInsertionDeletionProbability":0.015,"enabledSensors":["HorizontalPosition","VerticalPosition","Age","Oscillator","Random","HorizontalSpeed","VerticalSpeed","HorizontalBorderDistance","VerticalBorderDistance","BorderDistance","Mass"],"enabledActions":["MoveNorth","MoveSouth","MoveEast","MoveWest","RandomMove","MoveForward","Photosynthesis"],"lastCreatureIdCreated":500,"lastCreatureCount":500,"lastSurvivorsCount":31,"lastFitnessMaxValue":6.2,"lastSurvivalRate":0.062},"worldControllerData":{"size":100,"stepsPerGen":300,"initialPopulation":500,"worldObjects":[{"data":{"x":0.25,"y":0.25,"width":0.5,"height":0.5,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0,"y":0,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.2,"y":0.2,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.4,"y":0.4,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.6,"y":0.6,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.8,"y":0.8,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}],"pauseBetweenSteps":0,"immediateSteps":1,"pauseBetweenGenerations":0,"currentGen":4,"currentStep":263,"lastGenerationDuration":1094,"totalTime":5468}}';



scenarioObjects.push({name: "Carlos' original", data: scenarioDataCarlos});
