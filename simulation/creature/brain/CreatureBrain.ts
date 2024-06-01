import Creature from "../Creature";
import CreatureSensors from "./CreatureSensors";
import CreatureActions from "./CreatureActions";
import Genome from "./Genome";
import { Network } from "./Network";
import Connection from "./Connection";
import Neuron, { NeuronType } from "./Neuron";
import NeuronNode from "./NeuronNode";

export const initialNeuronOutput = 0.5;

export default class CreatureBrain {
    creature : Creature;
    sensors: CreatureSensors;   // shortcut to generations.sensors
    actions: CreatureActions;   // shortcut to generations.actions
    brain!: Network;
    genome: Genome;
    _networkInputCount: number;
    _networkOutputCount: number;
    _maxNumberNeurons: number;

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

    step() : number  {

        const calculateSensorOutputs = this.sensors.calculateOutputs(this.creature);
        const outputs = this.brain.feedForward(calculateSensorOutputs);
        const energyConsumedByActionsExecution = this.actions.executeActions(this.creature, outputs);
        return energyConsumedByActionsExecution;

    }
    
    private createBrainFromGenome() {
        // Create connections from genes
        const connections: Connection[] = [];
        for (let geneIdx = 0; geneIdx < this.genome.genes.length; geneIdx++) {
            const connection = Genome.geneToConnection(this.genome.genes[geneIdx], this.creature.generations);
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
    }

}