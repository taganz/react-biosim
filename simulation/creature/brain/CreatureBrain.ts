import Creature from "../Creature";
import CreatureSensors from "./CreatureSensors";
import CreatureActions from "./CreatureActions";
import Genome from "./Genome";
import { Network } from "./Network";
import Connection from "./Connection";
import { NeuronType } from "./Neuron";
import { DetectedCreature } from "@/simulation/world/grid/GridDetect";
import { buildNetworkFromGenes, initialNeuronOutput } from "./buildNetwork";

export { initialNeuronOutput };

// the stamina settings of files saved without them
export const STAMINA_MISSING_VALUES = { STAMINA_DEFAULT: 1, STAMINA_MIN: 0.05, STAMINA_MUTATION_STEP: 0.05 };

export default class CreatureBrain {
    creature : Creature;
    sensors: CreatureSensors;   // shortcut to generations.sensors
    actions: CreatureActions;   // shortcut to generations.actions
    brain!: Network;
    genome: Genome;
    _networkInputCount: number;
    _networkOutputCount: number;
    _maxNumberNeurons: number;
    // whether a final connection reads a prey sensor: without one the prey search is skipped
    usesPreySensors: boolean = false;
    // whether the brain needs the closest prey: it reads a prey sensor or is connected to MoveToPrey
    usesPreySearch: boolean = false;
    // the closest prey found at the start of the last thought (null: none, or no search)
    sensedPrey: DetectedCreature | null = null;
    // whether a final connection reads the Random sensor: without one it draws no number
    usesRandomSensor: boolean = false;
    // the enabled ids of the sensors that the final connections read: only these are computed
    sensorIds: number[] = [];
    // share of the steps in which the brain runs, from STAMINA_MIN to 1. Always 1 without the
    // Stamina action; otherwise the weight of the first Stamina gene, or STAMINA_DEFAULT
    stamina: number = 1;
    // the genes that drive the Stamina action: their positions in the genome, the first one gives the stamina
    staminaGeneIndexes: number[] = [];
    // mass spent in each step the brain runs: the costs of the sensors it reads and the actions it is connected to
    thinkCost: number = 0;

    constructor(creature: Creature, genome: Genome) {

        this.creature = creature;
    
        // Sensors and actions
        this.sensors = this.creature.generations.sensors;
        this.actions = this.creature.generations.actions;

        this.genome = genome;

        // console.log(this.genome.toDecimalString());
        // console.log(this.genome.toBitString())

        // Total number of available sensors and actions in this simulation
        this._networkInputCount = this.sensors.neuronsCount;
        this._networkOutputCount = this.actions.neuronsCount;
        this._maxNumberNeurons = this.creature.generations.maxNumberNeurons;
        
        this.createBrainFromGenome();

    }

    step() : void  {

        // each network keeps its own sensor values: the UI shows those of the selected creature
        const inputs = this.brain.inputs;
        // one search for the prey sensors and MoveToPrey, before any action changes the grid
        if (this.usesPreySearch) {
            this.sensedPrey = CreatureSensors.searchPrey(this.creature);
            this.sensors.writeOutputs(this.creature, this.sensorIds, inputs, this.sensedPrey);
        } else {
            this.sensors.writeOutputs(this.creature, this.sensorIds, inputs);
        }
        const outputs = this.brain.feedForward(inputs);
        this.actions.executeActions(this.creature, outputs);

    }
    
    private createBrainFromGenome() {
        // Stamina genes are not connections: the first one gives the stamina and all are left out
        const staminaId = this.actions.data.Stamina.enabled ? this.actions.actionNameToId("Stamina") : -1;
        const built = buildNetworkFromGenes(this.genome.genes, {
            sensorCount: this._networkInputCount,
            actionCount: this._networkOutputCount,
            maxNeurons: this._maxNumberNeurons,
        }, staminaId);
        this.brain = built.network;
        this.staminaGeneIndexes = built.staminaGeneIndexes;
        const staminaWeight = built.staminaWeight;
        const finalConnections = built.network.connections;
        this.usesPreySensors = this.sensors.readsPreySensors(finalConnections);
        const moveToPreyId = this.actions.data.MoveToPrey.enabled ? this.actions.actionNameToId("MoveToPrey") : -1;
        this.usesPreySearch = this.usesPreySensors || finalConnections.some((connection) =>
            connection.sinkType === NeuronType.ACTION && connection.sinkId === moveToPreyId);
        this.usesRandomSensor = this.sensors.readsRandomSensor(finalConnections);
        this.sensorIds = this.sensors.readSensorIds(finalConnections);
        this.thinkCost = this.computeThinkCost(finalConnections);
        if (staminaId >= 0) {
            this.stamina = CreatureBrain.staminaFromWeight(
                staminaWeight, this.creature.generations.worldController.simData.worldControllerData);
        }
    }

    // each sensor read and each action connected counts once, however many connections it has
    private computeThinkCost(connections: Connection[]): number {
        const data = this.creature.generations.worldController.simData.worldControllerData;
        const sensorCosts = data.SENSOR_COSTS;
        const actionCosts = data.ACTION_COSTS;
        let cost = 0;
        for (const id of this.sensorIds) {
            cost += sensorCosts?.[this.sensors.enabledSensors[id]] ?? 0;
        }
        const actionIds = new Set<number>();
        for (const connection of connections) {
            if (connection.sinkType === NeuronType.ACTION) actionIds.add(connection.sinkId);
        }
        for (const id of actionIds) {
            cost += actionCosts?.[this.actions.enabledActions[id]] ?? 0;
        }
        return cost;
    }

    // weight -4..4 to stamina 0..1, kept between STAMINA_MIN and 1; no weight: STAMINA_DEFAULT
    static staminaFromWeight(weight: number | null,
            data: { STAMINA_DEFAULT?: number, STAMINA_MIN?: number }): number {
        const value = weight === null ? data.STAMINA_DEFAULT ?? STAMINA_MISSING_VALUES.STAMINA_DEFAULT : (weight + 4) / 8;
        const min = Math.min(1, Math.max(0.001, data.STAMINA_MIN ?? STAMINA_MISSING_VALUES.STAMINA_MIN));
        return Math.min(1, Math.max(min, value));
    }

}