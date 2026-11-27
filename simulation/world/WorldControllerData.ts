import type { SensorName } from "../creature/brain/CreatureSensors";
import type { ActionName } from "../creature/brain/CreatureActions";
import type { Genus } from "../creature/CreatureGenus";

/** share of what a creature takes that becomes its own mass: from its cell by photosynthesis, or from its prey */
export type AssimilationEfficiency = { photosynthesis?: number, prey?: number };




export default interface WorldControllerData {
    // initial values
    size: number; 
    stepsPerGen: number;

    // model values
    MASS_WATER_TO_MASS_PER_STEP : number, 
    MASS_AT_BIRTH_PLANT : number, 
    MASS_AT_BIRTH_ATTACK_PLANT : number, 
    MASS_MAX_MULTIPLE_MASS_AT_BIRT : number, 
    
    MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE : number, 
    MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY : number,
    /** mass spent in every step the brain runs, by name, for each sensor it reads and each action it is
     *  connected to. Missing: 0 */
    SENSOR_COSTS? : Partial<Record<SensorName, number>>,
    ACTION_COSTS? : Partial<Record<ActionName, number>>,

    /** with the Stamina action enabled: stamina of a genome without a Stamina gene (0 to 1). Missing: 1 */
    STAMINA_DEFAULT? : number,
    /** with the Stamina action enabled: the lowest stamina a gene can give (0 to 1). Missing: 0.05 */
    STAMINA_MIN? : number,
    /** with the Stamina action enabled: a mutation of the Stamina gene moves the stamina up to this much. Missing: 0.05 */
    STAMINA_MUTATION_STEP? : number,

    REPRODUCTION_COST_PER_MASS_TRY : number, 
    REPRODUCTION_COST_PER_MASS_DO : number, 
    REPRODUCTION_MULTIPLE_MASS_AT_BIRTH : number,
    /** the child of the Reproduction action is born in a free cell as far as possible from the parent,
     *  up to this percentage of the world size (rounded, at least 1 cell: only the 8 cells around). Missing: 4 */
    REPRODUCTION_OFFSPRING_MAX_DISTANCE_PERCENT? : number,

    ACTION_ATTACK_OFFSET : number,

    /** mass lost by every move attempt, blocked or not, as a multiple of birth mass */
    MOVE_COST_PER_MASS : number,
    MOVE_MULTIPLE_MASS_AT_BIRTH : number, 

    /** mass lost by every attack, successful or not, as a multiple of birth mass */
    ATTACK_COST_PER_MASS : number,
    ATTACK_MIN_PREY_MASS_FACTOR : number
    /** attackers can eat other species of their genus, never their own species. Missing: off */
    ATTACK_SAME_GENUS? : boolean
    /** by genus, the share of the water taken by photosynthesis and of the prey eaten that becomes mass;
     *  the rest goes to the cloud. Missing: 1 */
    ASSIMILATION_EFFICIENCY? : Partial<Record<Exclude<Genus, "unknown">, AssimilationEfficiency>>

    // user values
    pauseBetweenSteps: number;
    immediateSteps: number;
    pauseBetweenGenerations: number;
    
    // state values
    simCode: string;
    currentGen: number;
    currentStep: number;
    lastGenerationDuration: number;
    totalTime: number;

    /** seed of the random generator: set it to repeat a run. Missing: a new random seed for every run */
    seed?: number;
    /** seed the saved run used, and the generator state when it was saved (missing in older files) */
    runSeed?: number;
    rngState?: number;
    

}