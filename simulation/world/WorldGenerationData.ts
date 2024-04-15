import  {SensorName}  from "@/simulation/creature/sensors/CreatureSensors";
import  {ActionName} from "@/simulation/creature/actions/CreatureActions";
import SelectionMethod from "@/simulation/creature/selection/SelectionMethod";
import PopulationStrategy from "@/simulation/creature/population/PopulationStrategy";
import { MutationMode } from "@/simulation/creature/genome/MutationMode";

export default interface WorldGenerationData {
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
    // state values 
    lastCreatureIdCreated: number;
    lastCreatureCount: number;
    lastSurvivorsCount: number;
    lastFitnessMaxValue: number;
    lastSurvivalRate: number;
}