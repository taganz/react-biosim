import Creature from "@/simulation/creature/Creature";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { SIMULATION_DATA_DEFAULT } from "@/simulation/simulationDataDefault";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus, { Genus } from "@/simulation/creature/CreatureGenus";
import { GridPosition } from "@/simulation/world/grid/Grid";
import { LogEvent } from "@/simulation/logger/LogEvent";

// which neighbour an attack genus eats, and how it makes room for a child
describe('attack and reproduction', () => {

    let worldController : WorldController;

    beforeEach(() => {
        jest.spyOn(console, "log").mockImplementation(() => {});
        const simulationData : SimulationData = {
            ...SIMULATION_DATA_DEFAULT,
            worldObjects: [],
            worldControllerData: { ...SIMULATION_DATA_DEFAULT.worldControllerData, size: 5 },
            worldGenerationsData: { ...SIMULATION_DATA_DEFAULT.worldGenerationsData, initialPopulation: 0, metabolismEnabled: true },
        };
        worldController = new WorldController(simulationData);
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

    // fills the 8 cells around (2, 2) with the genus given for each, null leaves the cell empty
    function surround(genusAt: (position: GridPosition) => Genus | null) {
        for (let x = 1; x <= 3; x++) {
            for (let y = 1; y <= 3; y++) {
                if (x == 2 && y == 2) continue;
                const genus = genusAt([x, y]);
                if (genus) spawn(genus, [x, y]);
            }
        }
    }

    test('a newborn attack_plant has enough mass to attack with the default settings', () => {
        const attacker = spawn("attack_plant", [2, 2]);
        expect(attacker.mass).toBe(attacker.massAtBirth);
        spawn("plant", [3, 2]);

        attacker.attack(1, attacker.findPreyDirection());

        expect(attacker.killCount).toBe(1);
        expect(attacker.mass).toBeGreaterThan(attacker.massAtBirth);
    });

    test('there is no minimum mass to attack', () => {
        const attacker = spawn("attack_plant", [2, 2]);
        attacker._mass._mass = attacker.massAtBirth / 2;
        const prey = spawn("plant", [3, 2]);
        prey._mass._mass = attacker.mass / 4;

        attacker.attack(1, attacker.findPreyDirection());

        expect(attacker.killCount).toBe(1);
        expect(prey.deathCause).toBe("attacked");
    });

    test('the parent eats a neighbour to make room for its child whatever its mass', () => {
        const parent = spawn("attack_plant", [2, 2]);
        surround(([x, y]) => (x == 3 && y == 3) ? "plant" : "attack_plant");
        const prey = worldController.generations.grid.cell(3, 3).creature!;
        prey._mass._mass = 0.01;
        parent._mass._mass = 0.1;

        expect(parent.eatNeighbourForOffspring()).toEqual([3, 3]);
        expect(prey.deathCause).toBe("attacked");
    });

    test('the attack picks a neighbour that can be eaten, not the first one found', () => {
        const attacker = spawn("attack_plant", [2, 2]);
        spawn("attack_plant", [2, 1]);
        spawn("attack_plant", [2, 3]);
        spawn("attack_plant", [1, 2]);
        spawn("plant", [3, 2]);

        for (let i = 0; i < 10; i++) {
            expect(attacker.findPreyDirection()).toBe("E");
        }
    });

    test('there is no target when no neighbour can be eaten', () => {
        const attacker = spawn("attack_plant", [2, 2]);
        spawn("attack_plant", [2, 1]);
        const heavyPlant = spawn("plant", [3, 2]);
        heavyPlant._mass._mass = attacker.mass;      // more than mass / ATTACK_MIN_PREY_MASS_FACTOR

        expect(attacker.findPreyDirection()).toBeNull();
    });

    test('a plant never eats', () => {
        const plant = spawn("plant", [2, 2]);
        const attacker = spawn("attack_plant", [3, 2]);
        attacker._mass._mass = 0.1;

        expect(plant.findPreyDirection()).toBeNull();
    });

    test('without enough mass reproduction is not a try: no mass is lost and nothing is logged', () => {
        const parent = spawn("attack_plant", [2, 2]);
        const log = jest.spyOn(parent, "log");
        const before = parent.mass;

        parent.reproduce(1);

        expect(parent.mass).toBe(before);
        expect(log).not.toHaveBeenCalledWith(LogEvent.REPRODUCE_TRY, expect.anything(), expect.anything());
    });

    test('with no free cell the parent eats a neighbour and the child takes its cell', () => {
        const parent = spawn("attack_plant", [2, 2]);
        surround(([x, y]) => (x == 3 && y == 3) ? "plant" : "attack_plant");
        const prey = worldController.generations.grid.cell(3, 3).creature!;
        parent._mass._mass = parent._mass._maxMass;
        const creaturesBefore = worldController.generations.currentCreatures.length;

        parent.reproduce(1);

        expect(prey.isAlive).toBe(false);
        expect(prey.deathCause).toBe("attacked");
        expect(parent.killCount).toBe(1);
        expect(parent.childrenCount).toBe(1);
        const child = worldController.generations.grid.cell(3, 3).creature!;
        expect(child.parentId).toBe(parent.id);
        expect(worldController.generations.currentCreatures.length).toBe(creaturesBefore + 1);

        // when the loop removes the dead prey, the child stays in the cell
        worldController.generations.grid.removeCreature(prey);
        expect(worldController.generations.grid.cell(3, 3).creature).toBe(child);
    });

    test('the eaten prey can leave the creature list after the child has moved out of its cell', () => {
        const parent = spawn("attack_plant", [2, 2]);
        surround(([x, y]) => (x == 3 && y == 3) ? "plant" : "attack_plant");
        const prey = worldController.generations.grid.cell(3, 3).creature!;
        parent._mass._mass = parent._mass._maxMass;
        parent.reproduce(1);

        worldController.generations.grid.cell(3, 3).creature = null;

        expect(() => worldController.generations.grid.removeCreature(prey)).not.toThrow();
    });

    test('with no free cell and nothing to eat the try costs mass and logs it', () => {
        const parent = spawn("attack_plant", [2, 2]);
        surround(() => "attack_plant");
        parent._mass._mass = parent._mass._maxMass;
        const log = jest.spyOn(parent, "log");
        const before = parent.mass;

        parent.reproduce(1);

        const consumed = parent.massAtBirth * worldController.simData.worldControllerData.REPRODUCTION_COST_PER_MASS_TRY;
        expect(parent.mass).toBeCloseTo(before - consumed);
        expect(parent.childrenCount).toBe(0);
        expect(log).toHaveBeenCalledWith(LogEvent.REPRODUCE_TRY, "mass consumed", consumed);
    });
});
