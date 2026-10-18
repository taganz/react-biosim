// load the defaults first, like the other tests: other import orders hit a circular import
import "@/simulation/simulationDataDefault";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import { selectPopulationStrategy } from "@/simulation/generations/population/populationStrategyOptions";
import { selectSelectionMethod } from "@/simulation/generations/selection/selectionMethodOptions";

/* the next generations are 20% children of the herbivore survivors and 80% new plants */

describe("PlantHerbivorePopulation", () => {
  const initialPopulation = 100;
  let worldController: WorldController;

  beforeEach(() => {
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});

    const generationsData = startUpScenarioSimulationData.worldGenerationsData;
    const simulationData: SimulationData = {
      ...startUpScenarioSimulationData,
      worldObjects: [],
      worldControllerData: { ...startUpScenarioSimulationData.worldControllerData, size: 30 },
      worldGenerationsData: {
        ...generationsData,
        initialPopulation,
        metabolismEnabled: true,
        populationStrategy: selectPopulationStrategy("PlantHerbivorePopulation"),
        selectionMethod: selectSelectionMethod("GreatestMassSelection"),
        enabledActions: Array.from(new Set([...generationsData.enabledActions, "Photosynthesis", "Reproduction", "AttackPlant"])),
      },
    };
    worldController = new WorldController(simulationData);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function populateNextGeneration(parentCount: number) {
    const generations = worldController.generations;
    generations.populate();
    const herbivores = generations.currentCreatures.filter((creature) => creature._genus === "attack_plant");
    expect(herbivores.length).toBe(initialPopulation * 0.2);

    // reuse the herbivores of generation 1 as parents, repeating them to get parentCount
    const parents = Array.from({ length: parentCount }, (_, i) => herbivores[i % herbivores.length]);
    generations.grid.clearCreatures();
    generations.currentCreatures = [];
    worldController.currentGen = 2;
    generations.populationStrategy.populate(generations, parents);
    return generations.currentCreatures;
  }

  test.each([
    ["fewer parents than herbivores needed", 5],
    ["more parents than herbivores needed", 30],
  ])("adds herbivores and plants with %s", (_, parentCount) => {
    const creatures = populateNextGeneration(parentCount);
    expect(creatures.filter((creature) => creature._genus === "attack_plant").length).toBe(initialPopulation * 0.2);
    expect(creatures.filter((creature) => creature._genus === "plant").length).toBe(initialPopulation * 0.8);
  });
});
