import Creature from "@/simulation/creature/Creature";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { SIMULATION_DATA_DEFAULT } from "@/simulation/simulationDataDefault";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus from "@/simulation/creature/CreatureGenus";

// the life history fields of a creature: lineage, counters and death
describe('creature history', () => {

    let worldController : WorldController;
    let parent : Creature;

    beforeEach(() => {
        const simulationData : SimulationData = SIMULATION_DATA_DEFAULT;
        simulationData.worldObjects = [];
        simulationData.worldControllerData.size = 5;
        simulationData.worldGenerationsData.initialPopulation = 3;
        simulationData.worldGenerationsData.metabolismEnabled = true;
        worldController = new WorldController(simulationData);
        const genomePlant = new Genome([CreatureGenus.mainGeneForGenus(worldController.generations, "plant")]);
        parent = worldController.generations.newCreature([1, 1], true, genomePlant);
    });

    test('a creature of the first generation has no parent', () => {
        expect(parent.parentId).toBeNull();
        expect(parent.parentBirthGen).toBeNull();
        expect(parent.childrenCount).toBe(0);
        expect(parent.birthGen).toBe(worldController.currentGen);
    });

    test('newCreature with a parent records the lineage', () => {
        parent.birthGen = 6;
        worldController.currentGen = 7;
        const child = worldController.generations.newCreature([2, 2], false, parent.brain.genome, parent);
        expect(child.parentId).toBe(parent.id);
        expect(child.parentBirthGen).toBe(6);
        expect(child.birthGen).toBe(7);
        expect(parent.childrenCount).toBe(1);
    });

    test('reproduction records the parent', () => {
        // the default needs 300 times the birth mass, more than the maximum mass
        const data = worldController.simData.worldControllerData;
        const multiple = data.REPRODUCTION_MULTIPLE_MASS_AT_BIRTH;
        data.REPRODUCTION_MULTIPLE_MASS_AT_BIRTH = 3;
        parent._mass._mass = parent._mass._maxMass;
        const before = worldController.generations.currentCreatures.length;
        parent.reproduce(1);
        data.REPRODUCTION_MULTIPLE_MASS_AT_BIRTH = multiple;
        const creatures = worldController.generations.currentCreatures;
        expect(creatures.length).toBe(before + 1);
        expect(creatures[creatures.length - 1].parentId).toBe(parent.id);
        expect(parent.childrenCount).toBe(1);
    });

    test('photosynthesis adds up the water taken from the cell', () => {
        parent._mass._mass = parent.massAtBirth;
        const before = parent.mass;
        parent.photosynthesis(1);
        expect(parent.waterFromPhotosynthesis).toBeCloseTo(parent.mass - before);
    });

    test('a living creature has no death data', () => {
        expect(parent.deathCause).toBeNull();
        expect(parent.deathStep).toBeNull();
        expect(parent.deathGen).toBeNull();
    });

    test('death by old age is recorded with the step and generation', () => {
        worldController.currentStep = 42;
        worldController.currentGen = 3;
        parent._age = parent.maxAge + 1;
        parent.computeStep();
        expect(parent.isAlive).toBe(false);
        expect(parent.deathCause).toBe("old");
        expect(parent.deathStep).toBe(42);
        expect(parent.deathGen).toBe(3);
    });

    test('death by attack records the killer species', () => {
        parent.killedByAttack("#123456");
        expect(parent.deathCause).toBe("attacked");
        expect(parent.killedBySpecies).toBe("#123456");
    });

    test('the first cause of death is kept', () => {
        parent.health = 0;
        parent.killedByAttack("#123456");
        expect(parent.deathCause).toBe("health");
    });

    test('restoreCreature keeps the history', () => {
        parent.parentId = 12;
        parent.parentBirthGen = 3;
        parent.birthGen = 4;
        parent.childrenCount = 2;
        parent.attackCount = 5;
        parent.killCount = 1;
        parent.waterFromPhotosynthesis = 3.5;
        worldController.generations.grid.removeCreature(parent);
        const restored = worldController.generations.restoreCreature(parent);
        expect(restored).not.toBeNull();
        expect(restored!.parentId).toBe(12);
        expect(restored!.parentBirthGen).toBe(3);
        expect(restored!.birthGen).toBe(4);
        expect(restored!.childrenCount).toBe(2);
        expect(restored!.attackCount).toBe(5);
        expect(restored!.killCount).toBe(1);
        expect(restored!.waterFromPhotosynthesis).toBe(3.5);
    });
});
