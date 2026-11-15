import Creature from "@/simulation/creature/Creature";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus, { Genus } from "@/simulation/creature/CreatureGenus";
import { Grid, GridPosition } from "@/simulation/world/grid/Grid";
import { setSeed } from "@/simulation/helpers/random";

// The neighbour choices (free cell for a child, prey to eat) pick one valid candidate at random.
// They must return null without candidates, only valid candidates, and each with the same probability.

const REPEATS = 8000;

// chi-square statistic of the counts against a uniform distribution
function chiSquare(counts: Map<string, number>, candidates: number): number {
    const expected = REPEATS / candidates;
    let sum = 0;
    for (const count of counts.values()) sum += (count - expected) ** 2 / expected;
    return sum;
}
// 0.1 % critical values of the chi-square distribution, by degrees of freedom
const CHI2_CRITICAL: Record<number, number> = { 1: 10.83, 2: 13.82, 3: 16.27, 4: 18.47, 5: 20.52, 6: 22.46, 7: 24.32 };

function countChoices<T>(choose: () => T, key: (value: T) => string): Map<string, number> {
    const counts = new Map<string, number>();
    for (let i = 0; i < REPEATS; i++) {
        const k = key(choose());
        counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
}

describe('Grid.getNearByAvailablePosition', () => {
    beforeEach(() => setSeed(12345));

    test('returns null when every neighbour is solid or outside the world', () => {
        const grid = new Grid(3, [], 1);
        for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) grid._grid[x][y].isSolid = !(x == 0 && y == 0);
        expect(grid.getNearByAvailablePosition(0, 0)).toBeNull();
    });

    test('returns only free cells inside the world, each with the same probability', () => {
        const grid = new Grid(5, [], 1);
        grid._grid[1][0].isSolid = true;       // the corner (0, 0) has 3 neighbours: (1, 0), (0, 1), (1, 1)
        const counts = countChoices(() => grid.getNearByAvailablePosition(0, 0), (p) => String(p));
        expect([...counts.keys()].sort()).toEqual(["0,1", "1,1"]);
        expect(chiSquare(counts, 2)).toBeLessThan(CHI2_CRITICAL[1]);
    });

    test('chooses uniformly among the 8 neighbours when all are free', () => {
        const grid = new Grid(5, [], 1);
        const counts = countChoices(() => grid.getNearByAvailablePosition(2, 2), (p) => String(p));
        expect(counts.size).toBe(8);
        expect(counts.has("2,2")).toBe(false);
        expect(chiSquare(counts, 8)).toBeLessThan(CHI2_CRITICAL[7]);
    });

    test('with one free cell it returns that cell', () => {
        const grid = new Grid(3, [], 1);
        for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) grid._grid[x][y].isSolid = !(x == 1 && y == 1) && !(x == 2 && y == 0);
        expect(grid.getNearByAvailablePosition(1, 1)).toEqual([2, 0]);
    });
});

describe('CreatureAttack prey choice', () => {
    let worldController : WorldController;

    beforeEach(() => {
        jest.spyOn(console, "log").mockImplementation(() => {});
        const simulationData : SimulationData = {
            ...TEST_SIMULATION_DATA,
            worldObjects: [],
            worldControllerData: { ...TEST_SIMULATION_DATA.worldControllerData, size: 5 },
            worldGenerationsData: { ...TEST_SIMULATION_DATA.worldGenerationsData, initialPopulation: 0, metabolismEnabled: true },
        };
        worldController = new WorldController(simulationData);
        setSeed(12345);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function spawn(genus: Genus, position: GridPosition) : Creature {
        const genome = new Genome([CreatureGenus.mainGeneForGenus(worldController.generations, genus)]);
        const creature = worldController.generations.newCreature(position, true, genome);
        expect(creature.genus).toBe(genus);
        return creature;
    }

    test('without prey both searches return null', () => {
        const attacker = spawn("attack_plant", [2, 2]);
        spawn("attack_plant", [3, 2]);
        spawn("attack_animal", [1, 1]);      // too heavy to eat
        expect(attacker._attack.findPreyAround()).toBeNull();
        expect(attacker.findPreyDirection()).toBeNull();
    });

    test('a genus that does not attack never finds prey', () => {
        const plant = spawn("plant", [2, 2]);
        spawn("plant", [3, 2]);
        spawn("attack_plant", [2, 3]);
        expect(plant._attack.findPreyAround()).toBeNull();
        expect(plant.findPreyDirection()).toBeNull();
    });

    test('findPreyAround returns only prey, each with the same probability', () => {
        const attacker = spawn("attack_plant", [2, 2]);
        const preyPositions: GridPosition[] = [[1, 1], [3, 1], [2, 3]];
        for (const position of preyPositions) spawn("plant", position);
        spawn("attack_plant", [1, 2]);       // same genus, cannot be eaten
        const counts = countChoices(() => attacker._attack.findPreyAround(), (prey) => String(prey?.position));
        expect([...counts.keys()].sort()).toEqual(preyPositions.map(String).sort());
        expect(chiSquare(counts, 3)).toBeLessThan(CHI2_CRITICAL[2]);
    });

    test('findPreyDirection returns only directions of prey, each with the same probability', () => {
        const attacker = spawn("attack_plant", [2, 2]);
        spawn("plant", [2, 1]);              // N
        spawn("plant", [3, 2]);              // E
        spawn("plant", [1, 2]);              // W
        spawn("plant", [3, 3]);              // diagonal: not one of the 4 directions
        spawn("attack_plant", [2, 3]);       // S, same genus
        const counts = countChoices(() => attacker.findPreyDirection(), (direction) => String(direction));
        expect([...counts.keys()].sort()).toEqual(["E", "N", "W"]);
        expect(chiSquare(counts, 3)).toBeLessThan(CHI2_CRITICAL[2]);
    });
});
