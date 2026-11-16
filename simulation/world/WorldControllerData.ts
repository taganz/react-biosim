import type { SensorName } from "../creature/brain/CreatureSensors";
import type { ActionName } from "../creature/brain/CreatureActions";




export default interface WorldControllerData {
    // initial values
    size: number; 
    stepsPerGen: number;

    // model values
    MASS_WATER_TO_MASS_PER_STEP : number, 
    MASS_AT_BIRTH_PLANT : number, 
    MASS_AT_BIRTH_ATTACK_PLANT : number, 
    MASS_AT_BIRTH_ATTACK : number, 
    MASS_AT_BIRTH_ATTACK_ANIMAL : number, 
    MASS_MAX_MULTIPLE_MASS_AT_BIRT : number, 
    
    MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE : number, 
    MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY : number,
    /** mass spent in every step the brain runs for each sensor it reads. Missing: 0 */
    MASS_COST_PER_SENSOR? : number,
    /** mass spent in every step the brain runs for each action it is connected to. Missing: 0 */
    MASS_COST_PER_ACTION? : number,
    /** costs of single sensors and actions, by name, instead of MASS_COST_PER_SENSOR / MASS_COST_PER_ACTION */
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

    ACTION_REPRODUCTION_OFFSET : number,
    ACTION_ATTACK_OFFSET : number,

    MOVE_COST_PER_MASS_TRY : number, 
    MOVE_COST_PER_MASS_DO : number, 
    MOVE_MULTIPLE_MASS_AT_BIRTH : number, 

    ATTACK_COST_PER_MASS_TRY : number, 
    ATTACK_COST_PER_MASS_DO : number, 
    ATTACK_MIN_PREY_MASS_FACTOR : number
    /** attackers can eat other species of their genus, never their own species. Missing: off */
    ATTACK_SAME_GENUS? : boolean

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