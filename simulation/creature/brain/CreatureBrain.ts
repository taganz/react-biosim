import * as constants from "../../simulationConstants";
import Creature from "../Creature";
import CreatureSensors from "./../sensors/CreatureSensors";
import CreatureActions from "./../actions/CreatureActions";
import Genome from "./../genome/Genome";
import { Network } from "./Network";
import Connection from "./Connection";
import Neuron, { NeuronType } from "./Neuron";
import NeuronNode from "./../NeuronNode";

export const initialNeuronOutput = 0.5;

export default class CreatureBrain {
    creature : Creature;

    // Sensors and actions
    sensors: CreatureSensors;
    actions: CreatureActions;
    //TODO where are those used? RD 19/4/24
    // onlySensorsWithSingleOutput: boolean = false;
    // singleOutputSensorFunctions: ((creature: Creature) => number)[] = [];
    // singleInputs: number[] = [];

    // Neuronal network and genome
    brain!: Network;
    genome: Genome;
    _networkInputCount: number;
    _networkOutputCount: number;
    _maxNumberNeurons: number;

    constructor(creature: Creature, genome?: Genome) {

        this.creature = creature;
    
        // Sensors and actions
        this.sensors = this.creature.generations.sensors;
        this.actions = this.creature.generations.actions;

        if (genome) {
            this.genome = genome;
        } else {
        this.genome = new Genome(
            [...new Array(creature.generations.initialGenomeSize)].map(() =>
            Genome.generateRandomGene()
            ));
        }    
        // console.log(this.genome.toDecimalString());
        // console.log(this.genome.toBitString())

        // Network input and output count
        this._networkInputCount = this.sensors.neuronsCount;
        this._networkOutputCount = this.actions.neuronsCount;
        this._maxNumberNeurons = this.creature.generations.maxNumberNeurons;
        
        this.createBrainFromGenome();

    }

    step() {

        // Calculate outputs of neuronal network
        const outputs = this.calculateOutputs(this.calculateInputs());

        // Execute actions with outputs
        this.actions.executeActions(this.creature, outputs);

    }

    getColor(): string {
        return this.genome.getColor();
      }
    
    
    private createBrainFromGenome() {
        // Create connections from genes
        const connections: Connection[] = [];
        for (let geneIdx = 0; geneIdx < this.genome.genes.length; geneIdx++) {
        let [sourceType, sourceId, sinkType, sinkId, weigth] =
            this.genome.getGeneData(geneIdx);

        // Renumber sourceId: from random number to one of the available options<
        if (sourceType === NeuronType.SENSOR) {
            sourceId %= this._networkInputCount;
        } else {
            sourceId %= this._maxNumberNeurons;
        }

        // Renumber sinkId
        if (sinkType === NeuronType.ACTION) {
            sinkId %= this._networkOutputCount;
        } else {
            sinkId %= this._maxNumberNeurons;
        }

        // Renumber weigth to a -4 and 4
        weigth = weigth / 8192 - 4;

        connections.push(
            new Connection(sourceType, sourceId, sinkType, sinkId, weigth)
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
    }

    private calculateInputs(): number[] {
        return this.sensors.calculateOutputs(this.creature);
    }

    private calculateOutputs(inputs: number[]): number[] {
        return this.brain.feedForward(inputs);
    }

}