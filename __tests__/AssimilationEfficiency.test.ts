import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import Creature from "@/simulation/creature/Creature";
import CreatureMass from "@/simulation/creature/CreatureMass";
import WorldControllerData from "@/simulation/world/WorldControllerData";

// ASSIMILATION_EFFICIENCY: the share of what a creature takes (water by photosynthesis, or its prey)
// that becomes its mass; the rest goes to the cloud
describe("ASSIMILATION_EFFICIENCY", () => {
  let worldController: WorldController;

  const setup = (efficiency?: WorldControllerData["ASSIMILATION_EFFICIENCY"]) => {
    const simulationData: SimulationData = structuredClone(TEST_SIMULATION_DATA);
    simulationData.worldObjects = [];
    simulationData.worldControllerData.size = 5;
    simulationData.worldControllerData.MASS_AT_BIRTH_PLANT = 1;
    simulationData.worldControllerData.MASS_AT_BIRTH_ATTACK_PLANT = 2;
    simulationData.worldControllerData.MASS_MAX_MULTIPLE_MASS_AT_BIRT = 5;
    simulationData.worldControllerData.ASSIMILATION_EFFICIENCY = efficiency;
    simulationData.worldGenerationsData.metabolismEnabled = true;
    simulationData.worldGenerationsData.initialPopulation = 3;
    simulationData.waterData.waterFirstRainPerCell = 2;
    simulationData.waterData.waterCellCapacity = 1000;
    simulationData.waterData.waterTotalPerCell = 10;
    simulationData.waterData.waterRainMaxPerCell = 0;
    simulationData.waterData.waterEvaporationPerCellPerGeneration = 0;
    worldController = new WorldController(simulationData);
  };

  const create = (genus: "plant" | "attack_plant", x: number): Creature => {
    const generations = worldController.generations;
    return generations.newCreature([x, 0], true, new Genome([CreatureGenus.mainGeneForGenus(generations, genus)]));
  };

  const water = () => worldController.worldWater;
  const expectWaterKept = () =>
    expect(water().waterInCells + water().waterInCreatures + water().waterInCloud).toBeCloseTo(water().totalWater, 10);

  test("missing: everything taken becomes mass, as before", () => {
    setup(undefined);
    const plant = create("plant", 1);
    const animal = create("attack_plant", 2);
    const cell = worldController.grid.cell(1, 0);
    const cloud = water().waterInCloud;

    expect(plant._mass.addFromGrid(cell, 1)).toBe(1);
    expect(plant.mass).toBe(2);
    expect(cell.water).toBe(1);
    expect(animal._mass.eat(plant._mass)).toBe(2);
    expect(animal.mass).toBe(4);
    expect(plant.mass).toBe(0);
    expect(water().waterInCloud).toBe(cloud);
    expectWaterKept();
  });

  test("photosynthesis: the efficiency of the water taken becomes mass, the rest goes to the cloud", () => {
    setup({ plant: { photosynthesis: 0.5 } });
    const plant = create("plant", 1);
    const cell = worldController.grid.cell(1, 0);
    const cloud = water().waterInCloud;

    expect(plant._mass.addFromGrid(cell, 1)).toBeCloseTo(0.5);
    expect(plant.mass).toBeCloseTo(1.5);
    expect(cell.water).toBeCloseTo(1);
    expect(water().waterInCloud).toBeCloseTo(cloud + 0.5);
    expectWaterKept();
  });

  test("photosynthesis near the maximum mass takes only what fits once assimilated", () => {
    setup({ plant: { photosynthesis: 0.5 } });
    const plant = create("plant", 1);
    plant._mass._mass = 4.8;   // maximum 5: room for 0.2
    worldController.worldWater.waterInCreatures += 3.8;
    worldController.worldWater.waterInCloud -= 3.8;
    const cell = worldController.grid.cell(1, 0);

    expect(plant._mass.addFromGrid(cell, 1)).toBeCloseTo(0.2);
    expect(plant.mass).toBeCloseTo(5);
    expect(cell.water).toBeCloseTo(2 - 0.4);
    expectWaterKept();
  });

  test("photosynthesis 0: the genus takes no water", () => {
    setup({ attack_plant: { photosynthesis: 0 } });
    const animal = create("attack_plant", 2);
    const cell = worldController.grid.cell(2, 0);

    expect(animal._mass.addFromGrid(cell, 1)).toBe(0);
    expect(animal.mass).toBe(2);
    expect(cell.water).toBe(2);
  });

  test("eating: the efficiency of the prey becomes mass, the rest goes to the cloud", () => {
    setup({ attack_plant: { prey: 0.4 } });
    const plant = create("plant", 1);
    const animal = create("attack_plant", 2);
    const cloud = water().waterInCloud;

    expect(animal._mass.eat(plant._mass)).toBeCloseTo(0.4);
    expect(animal.mass).toBeCloseTo(2.4);
    expect(plant.mass).toBe(0);
    expect(water().waterInCloud).toBeCloseTo(cloud + 0.6);
    expectWaterKept();
  });

  test("eating near the maximum mass takes only what fits once assimilated; the rest of the prey stays", () => {
    setup({ attack_plant: { prey: 0.5 } });
    const plant = create("plant", 1);
    plant._mass._mass = 3;
    worldController.worldWater.waterInCreatures += 2;
    worldController.worldWater.waterInCloud -= 2;
    const animal = create("attack_plant", 2);
    animal._mass._mass = 9;   // maximum 10: room for 1
    worldController.worldWater.waterInCreatures += 7;
    worldController.worldWater.waterInCloud -= 7;

    expect(animal._mass.eat(plant._mass)).toBeCloseTo(1);
    expect(animal.mass).toBeCloseTo(10);
    // 2 were taken, so 1 is left in the prey and returns to its cell when it dies
    expect(plant.mass).toBeCloseTo(1);
    expectWaterKept();
  });

  test("prey 0: the attacker gains nothing and the prey keeps its mass", () => {
    setup({ attack_plant: { prey: 0 } });
    const plant = create("plant", 1);
    const animal = create("attack_plant", 2);

    expect(animal._mass.eat(plant._mass)).toBe(0);
    expect(animal.mass).toBe(2);
    expect(plant.mass).toBe(1);
  });

  test("each genus reads its own row; values out of range are kept between 0 and 1", () => {
    setup({ plant: { photosynthesis: 0.3 }, attack_plant: { photosynthesis: 0, prey: 2 } });
    const plant = create("plant", 1);
    const animal = create("attack_plant", 2);

    expect(plant._mass._photosynthesisEfficiency).toBe(0.3);
    expect(plant._mass._preyEfficiency).toBe(1);
    expect(animal._mass._photosynthesisEfficiency).toBe(0);
    expect(animal._mass._preyEfficiency).toBe(1);
    expect(CreatureMass.efficiency(-1)).toBe(0);
    expect(CreatureMass.efficiency(NaN)).toBe(1);
  });
});
