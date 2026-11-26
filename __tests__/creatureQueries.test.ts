import Creature from "@/simulation/creature/Creature";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import { computeSpeciesStats, countLivingOfSpecies, creatureMassBalance, findLivingCreatureById, findLivingParent, speciesMembers } from "@/simulation/generations/creatureQueries";

describe('creature queries', () => {

    let worldController : WorldController;
    let genomeA : Genome;
    let genomeB : Genome;
    let a1 : Creature;
    let a2 : Creature;
    let b1 : Creature;

    beforeEach(() => {
        const simulationData : SimulationData = TEST_SIMULATION_DATA;
        simulationData.worldObjects = [];
        simulationData.worldControllerData.size = 5;
        simulationData.worldGenerationsData.initialPopulation = 3;
        worldController = new WorldController(simulationData);
        const generations = worldController.generations;
        genomeA = new Genome([CreatureGenus.mainGeneForGenus(generations, "plant")]);
        genomeB = new Genome([...genomeA.genes, CreatureGenus.mainGeneForGenus(generations, "plant")]);
        // the start of a generation
        generations.speciesRegistry.beginPlacing();
        a1 = generations.newCreature([0, 0], true, genomeA);
        b1 = generations.newCreature([1, 0], true, genomeB);
        a2 = generations.newCreature([2, 0], true, new Genome(genomeA.genes.slice()));
        generations.speciesRegistry.endPlacing();
    });

    // as WorldGenerations.step() does with the dead
    const kill = (creature: Creature) => {
        creature.health = 0;
        const generations = worldController.generations;
        generations.currentCreatures = generations.currentCreatures.filter((other) => other !== creature);
        generations.grid.removeCreature(creature);
        generations.speciesRegistry.removeDeadCreature(creature);
    };

    test('creatures with the same genes and no parent are one species', () => {
        expect(a1.speciesId).toBe(a2.speciesId);
        expect(a1.speciesId).not.toBe(b1.speciesId);
    });

    test('speciesMembers leaves out the same genome of another lineage', () => {
        a2.speciesId = "another";
        expect(speciesMembers(worldController.generations, a1)).toEqual([a1]);
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

    test('countLivingOfSpecies counts the living members and all the living', () => {
        expect(countLivingOfSpecies(worldController.generations, a1.speciesId)).toEqual({ members: 2, alive: 3 });
        a1.health = 0;
        expect(countLivingOfSpecies(worldController.generations, a1.speciesId)).toEqual({ members: 1, alive: 2 });
        expect(countLivingOfSpecies(worldController.generations, "none")).toEqual({ members: 0, alive: 2 });
    });

    describe('computeSpeciesStats', () => {
        test('counts the started, the born since and the dead', () => {
            // no mutation: the child keeps the species of its parent
            worldController.generations.newCreature([3, 0], true, a1.brain.genome, a1);
            kill(a1);
            const stats = computeSpeciesStats(worldController.generations, a2.speciesId);
            expect(stats).toMatchObject({ alive: 2, started: 2, bornSince: 1, died: 1 });
        });

        test('the living averages ignore the dead and other species', () => {
            a1._age = 10;
            a2._age = 20;
            b1._age = 1000;
            expect(computeSpeciesStats(worldController.generations, a2.speciesId).living?.age).toBe(15);
            kill(a1);
            expect(computeSpeciesStats(worldController.generations, a2.speciesId).living?.age).toBe(20);
        });

        test('the per creature averages divide by every known creature, dead or alive', () => {
            a1.childrenCount = 3;
            a1.waterFromPrey = 4;
            kill(a1);
            const { perCreature } = computeSpeciesStats(worldController.generations, a2.speciesId);
            expect(perCreature?.children).toBe(1.5);
            expect(perCreature?.fromPrey).toBe(2);
        });

        test('the mass balance sums to its mass and is averaged line by line', () => {
            a1._mass.setStartMass(2);
            a1.waterFromPhotosynthesis = 1;
            a1._mass.totalBasal = 0.5;
            a1._mass.totalMoving = 0.25;
            a1._mass.totalGivenToChildren = 1;
            expect(creatureMassBalance(a1).end).toBeCloseTo(1.25);
            a2._mass.setStartMass(1);
            a2._mass.totalBasal = 0.5;
            const { perCreature } = computeSpeciesStats(worldController.generations, a2.speciesId);
            expect(perCreature?.balance.start).toBe(1.5);
            expect(perCreature?.balance.basal).toBe(0.5);
            expect(perCreature?.balance.end).toBeCloseTo((1.25 + 0.5) / 2);
        });

        test('the shares of the living with enough mass', () => {
            jest.spyOn(a1, 'hasEnoughMassToMove').mockReturnValue(true);
            jest.spyOn(a2, 'hasEnoughMassToMove').mockReturnValue(false);
            a1.stepsStopped = 4;
            a2.stepsStopped = 2;
            const { living } = computeSpeciesStats(worldController.generations, a2.speciesId);
            expect(living?.canMove).toBe(50);
            expect(living?.stepsStopped).toBe(3);
        });

        test('the causes of death are shares of the deaths, the most frequent first', () => {
            const a3 = worldController.generations.newCreature([3, 0], true, new Genome(genomeA.genes.slice()));
            kill(a1);
            a1.deathCause = "old";
            kill(a2);
            a2.deathCause = "attacked";
            kill(a3);
            a3.deathCause = "attacked";
            const { deathCauses } = computeSpeciesStats(worldController.generations, a2.speciesId);
            expect(deathCauses.map(({ cause }) => cause)).toEqual(["attacked", "old"]);
            expect(deathCauses[0].percentage).toBeCloseTo(66.67);
        });

        test('the average age at death only counts the dead', () => {
            a1._age = 10;
            a2._age = 500;
            expect(computeSpeciesStats(worldController.generations, a2.speciesId).averageAgeAtDeath).toBeNull();
            kill(a1);
            expect(computeSpeciesStats(worldController.generations, a2.speciesId).averageAgeAtDeath).toBe(10);
        });

        test('has no averages without creatures', () => {
            expect(computeSpeciesStats(worldController.generations, "none")).toEqual({
                alive: 0, started: 0, bornSince: 0, died: 0, living: null, perCreature: null, averageAgeAtDeath: null, deathCauses: [],
            });
        });
    });
});
