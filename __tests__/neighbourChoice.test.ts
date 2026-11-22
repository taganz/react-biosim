import Creature from "@/simulation/creature/Creature";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus, { Genus } from "@/simulation/creature/CreatureGenus";
import { Grid, GridPosition } from "@/simulation/world/grid/Grid";
import { setSeed } from "@/simulation/helpers/random";
import { offspringMaxDistance } from "@/simulation/creature/CreaturerReproduction";

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

describe('Grid.getFarthestAvailablePosition', () => {
    beforeEach(() => setSeed(12345));

    const chebyshev = (p: GridPosition, x: number, y: number) => Math.max(Math.abs(p[0] - x), Math.abs(p[1] - y));

    test('with free cells at the maximum distance, chooses only those, each with the same probability', () => {
        const grid = new Grid(9, [], 1);
        const counts = countChoices(() => grid.getFarthestAvailablePosition(4, 4, 4)!, (p) => String(p));
        expect(counts.size).toBe(32);                  // the ring of side 9 around the centre
        for (const key of counts.keys()) expect(chebyshev(key.split(",").map(Number) as GridPosition, 4, 4)).toBe(4);
        // the chi-square of 32 cells has 31 degrees of freedom: 0.1 % critical value 61.1
        expect(chiSquare(counts, 32)).toBeLessThan(61.1);
    });

    test('falls back to the farthest ring that has a free cell', () => {
        const grid = new Grid(9, [], 1);
        // fill the rings at distance 4 and 3, and leave one free cell at distance 2
        for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) {
            if (chebyshev([x, y], 4, 4) >= 3) grid._grid[x][y].isSolid = true;
        }
        for (let i = 0; i < 50; i++) expect(chebyshev(grid.getFarthestAvailablePosition(4, 4, 4)!, 4, 4)).toBe(2);
    });

    test('cells outside the world do not count: near a corner it uses the part of the ring inside', () => {
        const grid = new Grid(9, [], 1);
        const counts = countChoices(() => grid.getFarthestAvailablePosition(0, 0, 4)!, (p) => String(p));
        expect(counts.size).toBe(9);                   // x = 4 or y = 4, both from 0 to 4
        for (const key of counts.keys()) expect(chebyshev(key.split(",").map(Number) as GridPosition, 0, 0)).toBe(4);
    });

    test('a maximum distance of 1 makes the same choices as getNearByAvailablePosition', () => {
        const grid = new Grid(5, [], 1);
        setSeed(7);
        const near = Array.from({ length: 20 }, () => grid.getNearByAvailablePosition(2, 2));
        setSeed(7);
        const farthest = Array.from({ length: 20 }, () => grid.getFarthestAvailablePosition(2, 2, 1));
        expect(farthest).toEqual(near);
    });

    test('returns null when no cell within the distance is free', () => {
        const grid = new Grid(9, [], 1);
        for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) grid._grid[x][y].isSolid = !(x == 4 && y == 4);
        expect(grid.getFarthestAvailablePosition(4, 4, 4)).toBeNull();
    });
});

describe('offspringMaxDistance', () => {
    test('is the percentage of the world size, rounded, at least 1', () => {
        expect(offspringMaxDistance(4, 100)).toBe(4);
        expect(offspringMaxDistance(4, 200)).toBe(8);
        expect(offspringMaxDistance(4, 30)).toBe(1);       // 1.2
        expect(offspringMaxDistance(5, 50)).toBe(3);       // 2.5
        expect(offspringMaxDistance(0, 100)).toBe(1);
    });

    test('files saved without it take 4 %', () => {
        expect(offspringMaxDistance(undefined, 100)).toBe(4);
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

    test('without prey there is no target', () => {
        const attacker = spawn("attack_plant", [2, 2]);
        spawn("attack_plant", [3, 2]);
        spawn("attack_animal", [1, 1]);      // too heavy to eat
        expect(attacker.findPreyDirection()).toBeNull();
    });

    test('a genus that does not attack never finds prey', () => {
        const plant = spawn("plant", [2, 2]);
        spawn("plant", [3, 2]);
        spawn("attack_plant", [2, 3]);
        expect(plant.findPreyDirection()).toBeNull();
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
