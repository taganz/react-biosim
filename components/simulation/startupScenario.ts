import WorldControllerData from "@/simulation/world/WorldControllerData";
import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import InsideReproductionAreaSelection from "@/simulation/generations/selection/InsideReproductionAreaSelection";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import RectangleObject from "@/simulation/world/objects/RectangleObject";

export const startupScenarioWorldGenerationsData : WorldGenerationsData = {
    populationStrategy: new AsexualRandomPopulation,
    selectionMethod: new InsideReproductionAreaSelection,
    initialPopulation: 1000,
    initialGenomeSize: 4,
    maxGenomeSize: 4,
    maxNumberNeurons: 1,
    mutationMode: MutationMode.wholeGene,
    mutationProbability: 0.05,
    deletionRatio: 0.5,
    geneInsertionDeletionProbability: 0.015,
    enabledSensors: [
            "HorizontalPosition",
            "VerticalPosition",
            "Age",
            "Oscillator",
            "Random",
            "HorizontalSpeed",
            "VerticalSpeed",
            "HorizontalBorderDistance",
            "VerticalBorderDistance",
            "BorderDistance"
          ],
    enabledActions: [
            "MoveNorth",
            "MoveSouth",
            "MoveEast",
            "MoveWest",
            "RandomMove",
            "MoveForward"
          ],
    metabolismEnabled: false,
    phenotypeColorMode: "genome",
    // state values 
    lastCreatureIdCreated: 0,
    lastCreatureCount: 0,
    lastSurvivorsCount: 0,
    lastFitnessMaxValue: 0,
    lastSurvivalRate: 0,
};

export const startupScenarioWorldControllerData : WorldControllerData = {
        // initial values
        size: 100, 
        stepsPerGen: 300,
        initialPopulation: 1000,   //         "initialPopulation": "1000",
        worldObjects: [
            new RectangleReproductionArea(0.47, 0.01, 0.53, 1, true),
            new RectangleObject(0, 0.9, 0.01, 0.01),
        ],
        gridPointWaterDefault: 1,
        gridPointWaterCapacityDefault: 20,
    
        // user values
        pauseBetweenSteps: 10,
        immediateSteps: 1,
        pauseBetweenGenerations: 0,
        
        // state values
        simCode: "SC1",
        currentGen: 0,
        currentStep: 0,
        lastGenerationDuration: 0,
        totalTime: 0



    };
    