import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import { DEFAULT_GENUS_PROBABILITIES } from "@/simulation/constantsDefault";
import { selectPopulationStrategy } from "@/simulation/generations/population/populationStrategyOptions";
import { selectSelectionMethod } from "@/simulation/generations/selection/selectionMethodOptions";

/* with metabolism, the water in creatures must match their mass across generations,
   also with selection methods that do not reset the world water (Reproduction) */

describe("water accounting across generations", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test.each([
    ["PlantHerbivorePopulation", "ReproductionSelection"],
    ["RandomFixedGenePopulation", "ReproductionSelection"],
    ["PlantHerbivorePopulation", "GreatestMassSelection"],
  ])("%s with %s", (strategy, selection) => {
    const generationsData = startUpScenarioSimulationData.worldGenerationsData;
    const simulationData: SimulationData = {
      ...startUpScenarioSimulationData,
      worldObjects: [],
      constants: { ...startUpScenarioSimulationData.constants, POPULATION_DEFAULT_GENUS: DEFAULT_GENUS_PROBABILITIES },
      worldControllerData: { ...startUpScenarioSimulationData.worldControllerData, size: 30, stepsPerGen: 50 },
      worldGenerationsData: {
        ...generationsData,
        initialPopulation: 200,
        metabolismEnabled: true,
        populationStrategy: selectPopulationStrategy(strategy),
        selectionMethod: selectSelectionMethod(selection),
        enabledActions: Array.from(new Set([...generationsData.enabledActions, "Photosynthesis", "Reproduction", "AttackPlant"])),
      },
    };
    const worldController = new WorldController(simulationData);
    worldController.startRun(simulationData);
    worldController.pause();

    for (let i = 0; i < 500; i++) {
      (worldController as any).runStep();
      const mass = worldController.generations.currentCreatures
        .filter((creature) => creature.isAlive)
        .reduce((total, creature) => total + creature.mass, 0);
      expect(worldController.worldWater.waterInCreatures).toBeCloseTo(mass, 6);
    }
    worldController.pause();
  });
});
