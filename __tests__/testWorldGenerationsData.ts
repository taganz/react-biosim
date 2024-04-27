import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import { testWorldControllerData } from "./testWorldControllerData";

export const testWorldGenerationsData : WorldGenerationsData = {
    populationStrategy: new AsexualZonePopulation,
    selectionMethod: new ReproductionSelection,
    initialPopulation: testWorldControllerData.initialPopulation,
    initialGenomeSize: 4,
    maxGenomeSize: 10,
    maxNumberNeurons: 3,
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
            "BorderDistance",
            "Mass"
          ],
    enabledActions: [
            "MoveNorth",
            "MoveSouth",
            "MoveEast",
            "MoveWest",
            "RandomMove",
            "MoveForward",
            "Photosynthesis",
            "Reproduction"
          ],
    metabolismEnabled: false,
    // state values 
    lastCreatureIdCreated: 0,
    lastCreatureCount: 0,
    lastSurvivorsCount: 0,
    lastFitnessMaxValue: 0,
    lastSurvivalRate: 0,
};
