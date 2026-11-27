import { SimulationData } from "@/simulation/SimulationData";
import { checkWaterSettings } from "@/simulation/water/checkWaterSettings";
import WorldController from "@/simulation/world/WorldController";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";

// size 10 (100 cells), 10 creatures of mass 1 to 6
function sim(water: Partial<SimulationData["waterData"]>, simulationType: "generational" | "continuous" = "generational"): SimulationData {
  const data: SimulationData = structuredClone(TEST_SIMULATION_DATA);
  data.worldObjects = [];
  data.worldControllerData.size = 10;
  data.worldControllerData.MASS_AT_BIRTH_PLANT = 1;
  data.worldControllerData.MASS_AT_BIRTH_ATTACK_PLANT = 6;
  data.worldGenerationsData.initialPopulation = 10;
  data.worldGenerationsData.simulationType = simulationType;
  data.waterData = {
    ...data.waterData,
    waterTotalPerCell: 10, waterFirstRainPerCell: 5, waterCellCapacity: 100, waterRainMaxPerCell: 5,
    ...water,
  };
  return data;
}

describe("checkWaterSettings", () => {
  test("enough water: no errors and no warnings", () => {
    expect(checkWaterSettings(sim({}))).toEqual({ errors: [], warnings: [] });
  });

  test("less water than the first generation needs even with the smallest mass: an error", () => {
    const check = checkWaterSettings(sim({ waterTotalPerCell: 0.05 }));
    expect(check.errors).toHaveLength(1);
    expect(check.errors[0]).toContain("at least 10 water");
  });

  test("enough only for the lighter genera: a warning", () => {
    const check = checkWaterSettings(sim({ waterTotalPerCell: 0.5, waterFirstRainPerCell: 0, waterRainMaxPerCell: 0 }));
    expect(check.errors).toEqual([]);
    expect(check.warnings).toEqual([expect.stringContaining("up to 60 water")]);
  });

  test("first rain larger than what is left, or than the cell capacity: warnings", () => {
    expect(checkWaterSettings(sim({ waterFirstRainPerCell: 10 })).warnings)
      .toEqual([expect.stringContaining("at most 9.90 each")]);
    expect(checkWaterSettings(sim({ waterFirstRainPerCell: 5, waterCellCapacity: 2 })).warnings)
      .toEqual([expect.stringContaining("Cell water capacity")]);
  });

  test("rain max above the total: a warning only in generational runs", () => {
    expect(checkWaterSettings(sim({ waterRainMaxPerCell: 20 })).warnings)
      .toEqual([expect.stringContaining("never rain")]);
    expect(checkWaterSettings(sim({ waterRainMaxPerCell: 20 }, "continuous")).warnings).toEqual([]);
  });

  test("startRun refuses the settings with the error and keeps the running world", () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const good = sim({});
    const worldController = new WorldController(good);
    const grid = worldController.grid;
    expect(() => worldController.startRun(sim({ waterTotalPerCell: 0.05 }))).toThrow("at least 10 water");
    expect(worldController.grid).toBe(grid);
    expect(worldController.simData).toBe(good);
    jest.restoreAllMocks();
  });
});
