import  {SensorName}  from "@/simulation/creature/brain/CreatureSensors";
import  {ActionName} from "@/simulation/creature/brain/CreatureActions";
import SelectionMethod from "@/simulation/generations/selection/SelectionMethod";
import PopulationStrategy from "@/simulation/generations/population/PopulationStrategy";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import {PhenoTypeColorMode} from "@/simulation/creature/PhenoTypeColorMode";

export default interface WorldGenerationsData {
    // initial values
    populationStrategy: PopulationStrategy;
    selectionMethod: SelectionMethod;
    initialPopulation: number;
    initialGenomeSize: number;
    maxGenomeSize: number;
    maxNumberNeurons: number;
    mutationMode: MutationMode;
    mutationProbability: number;
    deletionRatio: number;
    geneInsertionDeletionProbability: number;
    enabledSensors: SensorName[];
    enabledActions: ActionName[];
    metabolismEnabled: boolean;
    phenotypeColorMode: PhenoTypeColorMode;    //TODO aixo hauria d'estar en controller
    plantGenes : number[],                     // plant genes to add to initial random genes

    // state values 
    lastCreatureIdCreated: number;
    lastCreatureCount: number;
    lastSurvivorsCount: number;
    lastFitnessMaxValue: number;
    lastSurvivalRate: number;
}