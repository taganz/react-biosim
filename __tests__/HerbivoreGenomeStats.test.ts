import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import WorldGenerations from "@/simulation/generations/WorldGenerations";

describe('herbivore genome stats', () => {

    let generations : WorldGenerations;
    let plantGene : number;
    let small : number[];
    let large : number[];
    let otherLarge : number[];

    beforeEach(() => {
        const simulationData : SimulationData = TEST_SIMULATION_DATA;
        simulationData.worldObjects = [];
        simulationData.worldControllerData.size = 5;
        simulationData.worldGenerationsData.initialPopulation = 3;
        generations = new WorldController(simulationData).generations;
        plantGene = CreatureGenus.mainGeneForGenus(generations, "plant");
        const herbivoreGene = CreatureGenus.mainGeneForGenus(generations, "attack_plant");
        small = [herbivoreGene];
        large = [herbivoreGene, herbivoreGene, herbivoreGene];
        otherLarge = [herbivoreGene, herbivoreGene, plantGene];
    });

    const add = (x : number, genes : number[]) => generations.newCreature([x, 0], true, new Genome(genes.slice()));

    test('reports the largest genome and the average of the living herbivores', () => {
        add(0, small);
        add(1, large);
        add(2, new Array(9).fill(plantGene)); // a plant, not counted
        const dead = add(3, new Array(7).fill(small[0]));
        dead.health = 0;

        generations.closeHerbivoreGenomeStats();

        const stats = generations.lastHerbivoreGenomeStats!;
        expect(stats.alive).toBe(2);
        expect(stats.largest?.species.genomeSize).toBe(3);
        expect(stats.largest?.creatures).toBe(1);
        expect(stats.averageGenomeSize).toBe(2);
    });

    test('with a tie in size, the species with most creatures is the largest', () => {
        const single = add(0, otherLarge);
        const twice = add(1, large);
        add(2, large);
        expect(single.genus).toBe("attack_plant");

        generations.closeHerbivoreGenomeStats();

        const { largest } = generations.lastHerbivoreGenomeStats!;
        expect(largest?.species.code).toBe(twice.brain.genome.getHexColor());
        expect(largest?.creatures).toBe(2);
    });

    test('counts the deaths of old age of each species during the generation', () => {
        const old = [add(0, small), add(1, small), add(2, large)];
        const oldPlant = add(3, [plantGene, plantGene]);
        // killed, not of old age
        const attacked = add(4, large);
        attacked.health = 0;
        attacked.deathCause = "attacked";
        for (const creature of [...old, oldPlant]) creature._age = creature.maxAge + 1;

        generations.step();
        generations.closeHerbivoreGenomeStats();

        const { mostOldAgeDeaths } = generations.lastHerbivoreGenomeStats!;
        expect(mostOldAgeDeaths?.deaths).toBe(2);
        expect(mostOldAgeDeaths?.species.genomeSize).toBe(1);
        expect(mostOldAgeDeaths?.species.code).toBe(old[0].brain.genome.getHexColor());

        // the next generation starts counting again
        generations.closeHerbivoreGenomeStats();
        expect(generations.lastHerbivoreGenomeStats?.mostOldAgeDeaths).toBeNull();
    });

    test('has no values without herbivores', () => {
        add(0, [plantGene]);
        generations.closeHerbivoreGenomeStats();
        expect(generations.lastHerbivoreGenomeStats).toMatchObject({
            alive: 0, largest: null, averageGenomeSize: null, mostOldAgeDeaths: null,
        });
    });
});
