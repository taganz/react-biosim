import Creature from "@/simulation/creature/Creature";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { SIMULATION_DATA_DEFAULT } from "@/simulation/simulationDataDefault";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import { countLivingWithGenes, findLivingCreatureById, findLivingParent, haveSameGenome, speciesMembers } from "@/simulation/generations/creatureQueries";

describe('creature queries', () => {

    let worldController : WorldController;
    let genomeA : Genome;
    let genomeB : Genome;
    let a1 : Creature;
    let a2 : Creature;
    let b1 : Creature;

    beforeEach(() => {
        const simulationData : SimulationData = SIMULATION_DATA_DEFAULT;
        simulationData.worldObjects = [];
        simulationData.worldControllerData.size = 5;
        simulationData.worldGenerationsData.initialPopulation = 3;
        worldController = new WorldController(simulationData);
        const generations = worldController.generations;
        genomeA = new Genome([CreatureGenus.mainGeneForGenus(generations, "plant")]);
        genomeB = new Genome([...genomeA.genes, CreatureGenus.mainGeneForGenus(generations, "plant")]);
        a1 = generations.newCreature([0, 0], true, genomeA);
        b1 = generations.newCreature([1, 0], true, genomeB);
        a2 = generations.newCreature([2, 0], true, new Genome(genomeA.genes.slice()));
    });

    test('haveSameGenome compares the genes', () => {
        expect(haveSameGenome(a1, a2)).toBe(true);
        expect(haveSameGenome(a1, b1)).toBe(false);
    });

    test('speciesMembers lists the living members ordered by id', () => {
        expect(speciesMembers(worldController.generations, a2)).toEqual([a1, a2]);
        a1.health = 0;
        expect(speciesMembers(worldController.generations, a2)).toEqual([a2]);
    });

    test('findLivingParent needs the same id and birth generation', () => {
        a1.birthGen = 2;
        const child = worldController.generations.newCreature([3, 0], false, a1.brain.genome, a1);
        expect(findLivingParent(worldController.generations, child)).toBe(a1);
        // another creature with the parent's id, from another generation
        child.parentBirthGen = 1;
        expect(findLivingParent(worldController.generations, child)).toBeUndefined();
    });

    test('findLivingParent ignores dead parents and creatures without parent', () => {
        const child = worldController.generations.newCreature([3, 0], false, a1.brain.genome, a1);
        a1.health = 0;
        expect(findLivingParent(worldController.generations, child)).toBeUndefined();
        expect(findLivingParent(worldController.generations, a1)).toBeUndefined();
    });

    test('findLivingCreatureById ignores the dead and prefers the youngest', () => {
        expect(findLivingCreatureById(worldController.generations, a2.id)).toBe(a2);
        expect(findLivingCreatureById(worldController.generations, 999)).toBeUndefined();
        // another creature with the same id, born in a later generation
        b1.id = a2.id;
        b1.birthGen = a2.birthGen + 1;
        expect(findLivingCreatureById(worldController.generations, a2.id)).toBe(b1);
        b1.health = 0;
        expect(findLivingCreatureById(worldController.generations, a2.id)).toBe(a2);
    });

    test('countLivingWithGenes counts the living members and all the living', () => {
        expect(countLivingWithGenes(worldController.generations, genomeA.genes)).toEqual({ members: 2, alive: 3 });
        a1.health = 0;
        expect(countLivingWithGenes(worldController.generations, genomeA.genes)).toEqual({ members: 1, alive: 2 });
        expect(countLivingWithGenes(worldController.generations, [12345])).toEqual({ members: 0, alive: 2 });
    });
});
