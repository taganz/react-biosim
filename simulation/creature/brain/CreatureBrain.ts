import Creature from "../Creature";
import CreatureSensors from "./CreatureSensors";
import CreatureActions from "./CreatureActions";
import Genome from "./Genome";
import { Network } from "./Network";
import Connection from "./Connection";
import Neuron, { NeuronType } from "./Neuron";
import NeuronNode from "./NeuronNode";

export const initialNeuronOutput = 0.5;

// the stamina settings of files saved without them
export const STAMINA_MISSING_VALUES = { STAMINA_DEFAULT: 1, STAMINA_MIN: 0.05 };

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
    // whether a final connection reads the Random sensor: without one it draws no number
    usesRandomSensor: boolean = false;
    // the enabled ids of the sensors that the final connections read: only these are computed
    sensorIds: number[] = [];
    // share of the steps in which the brain runs, from STAMINA_MIN to 1. Always 1 without the
    // Stamina action; otherwise the weight of the first Stamina gene, or STAMINA_DEFAULT
    stamina: number = 1;
    // the genes that drive the Stamina action: their positions in the genome, the first one gives the stamina
    staminaGeneIndexes: number[] = [];

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
        this.sensors.writeOutputs(this.creature, this.sensorIds, inputs);
        const outputs = this.brain.feedForward(inputs);
        this.actions.executeActions(this.creature, outputs);

    }
    
    private createBrainFromGenome() {
        // Create connections from genes
        const connections: Connection[] = [];
        // Stamina genes are not connections: the first one gives the stamina and all are left out
        const staminaId = this.actions.data.Stamina.enabled ? this.actions.actionNameToId("Stamina") : -1;
        let staminaWeight: number | null = null;
        for (let geneIdx = 0; geneIdx < this.genome.genes.length; geneIdx++) {
            const connection = Genome.geneToConnection(this.genome.genes[geneIdx], this.creature.generations);
            if (connection.sinkType === NeuronType.ACTION && connection.sinkId === staminaId) {
                if (staminaWeight === null) staminaWeight = connection.weight;
                this.staminaGeneIndexes.push(geneIdx);
                continue;
            }
            /*
            // Renumber sourceId: from random number to one of the available options<
            if (connection.sourceType === NeuronType.SENSOR) {
                connection.sourceId %= this._networkInputCount;
            } else {
                connection.sourceId %= this._maxNumberNeurons;
            }

            // Renumber sinkId
            if (connection.sinkType === NeuronType.ACTION) {
                connection.sinkId %= this._networkOutputCount;
            } else {
                connection.sinkId %= this._maxNumberNeurons;
            }

            // Renumber weigth to a -4 and 4
            //weigth = weigth / 8192 - 4;
            */
            connections.push(
                //TODO refactor
                new Connection(connection.sourceType, connection.sourceId, 
                    connection.sinkType, connection.sinkId, connection.weight)
            );
        }

        // Build a map of neurons. We won't include sensor or action neurons
        const nodeMap: Map<number, NeuronNode> = new Map();
        for (
        let connectionIdx = 0;
        connectionIdx < connections.length;
        connectionIdx++
        ) {
        const connection = connections[connectionIdx];

        if (connection.sinkType === NeuronType.NEURON) {
            let node = nodeMap.get(connection.sinkId);

            if (!node) {
            node = new NeuronNode();
            nodeMap.set(connection.sinkId, node);
            }

            if (
            connection.sourceType == NeuronType.NEURON &&
            connection.sourceId == connection.sinkId
            ) {
            node.numSelfInputs++;
            } else {
            node.numInputsFromSensorsOrOtherNeurons++;
            }
        }

        if (connection.sourceType === NeuronType.NEURON) {
            let node = nodeMap.get(connection.sourceId);

            if (!node) {
            node = new NeuronNode();
            nodeMap.set(connection.sourceId, node);
            }

            node.numOutputs++;
        }
        }

        // Delete useless neurons
        let allDone = false;
        while (!allDone) {
        allDone = true;

        for (const [id, neuronNode] of nodeMap) {
            // Look for neurons with zero outputs, or neurons that only feed itself
            if (neuronNode.numOutputs === neuronNode.numSelfInputs) {
            allDone = false;

            // Find and remove connections from sensors or other neurons
            for (
                let connectionIdx = connections.length - 1;
                connectionIdx >= 0;
                connectionIdx--
            ) {
                const connection = connections[connectionIdx];

                if (
                connection.sinkType == NeuronType.NEURON &&
                connection.sinkId == id
                ) {
                // See if there's a neuron sourcing this connection
                if (connection.sourceType == NeuronType.NEURON) {
                    // Decrement the neuron's numOutputs:
                    (<NeuronNode>nodeMap.get(connection.sourceId)).numOutputs--;
                }

                // Remove the connection
                connections.splice(connectionIdx, 1);
                }
            }

            // Remove the neuron
            nodeMap.delete(id);
            }
        }
        }

        // Renumber neurons in nodeMap
        let newIndex = 0;
        for (const [_id, neuronNode] of nodeMap) {
        neuronNode.remappedIndex = newIndex;
        newIndex++;
        }

        // Create final array of connections
        const finalConnections: Connection[] = [];
        // We want to add first the connections between sensors and neurons,
        // and between neurons and neurons
        for (
        let connectionIdx = 0;
        connectionIdx < connections.length;
        connectionIdx++
        ) {
        const connection = connections[connectionIdx];

        if (connection.sinkType === NeuronType.NEURON) {
            const newConnection = connection.copy();

            // Use the new index for the sink neuron
            newConnection.sinkId = (<NeuronNode>(
            nodeMap.get(connection.sinkId)
            )).remappedIndex;

            if (newConnection.sourceType === NeuronType.NEURON) {
            // Use the new index for the source neuron
            newConnection.sourceId = (<NeuronNode>(
                nodeMap.get(connection.sourceId)
            )).remappedIndex;
            }

            finalConnections.push(newConnection);
        }
        }
        // Then we add the connections with actions
        for (
        let connectionIdx = 0;
        connectionIdx < connections.length;
        connectionIdx++
        ) {
        const connection = connections[connectionIdx];

        if (connection.sinkType === NeuronType.ACTION) {
            const newConnection = connection.copy();

            if (newConnection.sourceType === NeuronType.NEURON) {
            // Use the new index for the source neuron
            newConnection.sourceId = (<NeuronNode>(
                nodeMap.get(connection.sourceId)
            )).remappedIndex;
            }

            finalConnections.push(newConnection);
        }
        }

        // Create final array of neurons
        const finalNeurons: Neuron[] = [];
        for (const [_id, neuronNode] of nodeMap) {
        finalNeurons.push(
            new Neuron(
            initialNeuronOutput,
            neuronNode.numInputsFromSensorsOrOtherNeurons !== 0
            )
        );
        }

        this.brain = new Network(
            this._networkInputCount,
            this._networkOutputCount,
            finalNeurons,
            finalConnections
            );
        this.usesPreySensors = this.sensors.readsPreySensors(finalConnections);
        this.usesRandomSensor = this.sensors.readsRandomSensor(finalConnections);
        this.sensorIds = this.sensors.readSensorIds(finalConnections);
        if (staminaId >= 0) {
            this.stamina = CreatureBrain.staminaFromWeight(
                staminaWeight, this.creature.generations.worldController.simData.worldControllerData);
        }
    }

    // weight -4..4 to stamina 0..1, kept between STAMINA_MIN and 1; no weight: STAMINA_DEFAULT
    static staminaFromWeight(weight: number | null,
            data: { STAMINA_DEFAULT?: number, STAMINA_MIN?: number }): number {
        const value = weight === null ? data.STAMINA_DEFAULT ?? STAMINA_MISSING_VALUES.STAMINA_DEFAULT : (weight + 4) / 8;
        const min = Math.min(1, Math.max(0.001, data.STAMINA_MIN ?? STAMINA_MISSING_VALUES.STAMINA_MIN));
        return Math.min(1, Math.max(min, value));
    }

}