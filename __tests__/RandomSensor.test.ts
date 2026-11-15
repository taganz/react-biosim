import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import Connection from "@/simulation/creature/brain/Connection";
import { NeuronType } from "@/simulation/creature/brain/Neuron";
import { getRandomState, setSeed } from "@/simulation/helpers/random";

// The Random sensor draws a number only when the brain has a connection that reads it
describe('Random sensor', () => {
    let worldController : WorldController;

    beforeEach(() => {
        const simulationData : SimulationData = {
            ...TEST_SIMULATION_DATA,
            worldObjects: [],
            worldControllerData: { ...TEST_SIMULATION_DATA.worldControllerData, size: 5 },
            worldGenerationsData: { ...TEST_SIMULATION_DATA.worldGenerationsData, initialPopulation: 0 },
        };
        worldController = new WorldController(simulationData);
    });

    test('readsRandomSensor is true only with a connection from the Random sensor', () => {
        const sensors = worldController.generations.sensors;
        const randomId = sensors.sensorNameToId("Random");
        const massId = sensors.sensorNameToId("Mass");
        expect(randomId).toBeGreaterThanOrEqual(0);
        const fromSensor = (id: number) => new Connection(NeuronType.SENSOR, id, NeuronType.ACTION, 0, 1);
        expect(sensors.readsRandomSensor([fromSensor(massId)])).toBe(false);
        expect(sensors.readsRandomSensor([fromSensor(massId), fromSensor(randomId)])).toBe(true);
        // a connection from neuron number randomId is not the Random sensor
        expect(sensors.readsRandomSensor([new Connection(NeuronType.NEURON, randomId, NeuronType.ACTION, 0, 1)])).toBe(false);
    });

    test('without needRandom the sensor pushes 0, keeps one value per sensor and draws nothing', () => {
        const genome = new Genome([CreatureGenus.mainGeneForGenus(worldController.generations, "plant")]);
        const creature = worldController.generations.newCreature([2, 2], true, genome);
        const sensors = worldController.generations.sensors;
        const randomId = sensors.sensorNameToId("Random");

        setSeed(7);
        const state = getRandomState();
        const outputs = sensors.calculateOutputs(creature, false, false);
        expect(getRandomState()).toBe(state);
        expect(outputs).toHaveLength(sensors.neuronsCount);
        expect(outputs[randomId]).toBe(0);

        const withRandom = sensors.calculateOutputs(creature, false, true);
        expect(getRandomState()).not.toBe(state);
        expect(withRandom).toHaveLength(sensors.neuronsCount);
        expect(withRandom[randomId]).toBeGreaterThanOrEqual(0);
        expect(withRandom[randomId]).toBeLessThan(1);
    });

    test('the brain reads the Random sensor only when its final connections do', () => {
        const genome = new Genome([CreatureGenus.mainGeneForGenus(worldController.generations, "plant")]);
        const creature = worldController.generations.newCreature([2, 2], true, genome);
        const randomId = worldController.generations.sensors.sensorNameToId("Random");
        const reads = creature.brain.brain.connections.some((connection) =>
            connection.sourceType === NeuronType.SENSOR && connection.sourceId === randomId);
        expect(creature.brain.usesRandomSensor).toBe(reads);
    });
});
