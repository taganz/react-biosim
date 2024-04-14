import  {SensorName}  from "@/simulation/creature/sensors/CreatureSensors";
import  {ActionName} from "@/simulation/creature/actions/CreatureActions";
import SelectionMethod from "@/simulation/creature/selection/SelectionMethod";
import PopulationStrategy from "@/simulation/creature/population/PopulationStrategy";
import { MutationMode } from "@/simulation/creature/genome/MutationMode";
import WorldObject from "@/simulation/world/objects/WorldObject";


export default interface WorldInitialValues {
    size: number; 
    selectionMethod: SelectionMethod;
    populationStrategy: PopulationStrategy;
    stepsPerGen: number;
    initialPopulation: number;
    initialGenomeSize: number;
    maxGenomeSize: number;
    maxNumberNeurons: number;
    mutationMode: MutationMode;
    mutationProbability: number;
    geneInsertionDeletionProbability: number;
    enabledSensors: SensorName[];
    enabledActions: ActionName[];
    worldObjects : WorldObject[];


}