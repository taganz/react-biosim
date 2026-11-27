import { getChangedSections } from "@/components/simulation/tabs/scenario/scenarioSectionChanges";
import { startUpScenarioSimulationData as base } from "@/simulation/startupScenario";
import { SimulationData } from "@/simulation/SimulationData";

const withGenerations = (changes: object): SimulationData =>
  ({ ...base, worldGenerationsData: { ...base.worldGenerationsData, ...changes } });
const withController = (changes: object): SimulationData =>
  ({ ...base, worldControllerData: { ...base.worldControllerData, ...changes } });

describe("getChangedSections", () => {
  it("finds nothing in the same data or an equal copy", () => {
    expect(getChangedSections(base, base).size).toBe(0);
    const copy: SimulationData = {
      ...base,
      worldGenerationsData: { ...base.worldGenerationsData },
      waterData: { ...base.waterData },
      constants: { ...base.constants },
    };
    expect(getChangedSections(copy, base).size).toBe(0);
  });

  it("assigns each field to its section", () => {
    expect([...getChangedSections(withGenerations({ initialPopulation: 7 }), base)]).toEqual(["generations"]);
    expect([...getChangedSections(withController({ stepsPerGen: 7 }), base)]).toEqual(["generations"]);
    expect([...getChangedSections(withController({ size: 7 }), base)]).toEqual(["world"]);
    expect([...getChangedSections(withGenerations({ maxNumberNeurons: 99 }), base)]).toEqual(["networks"]);
    expect([...getChangedSections(withGenerations({ mutationProbability: 0.5 }), base)]).toEqual(["mutations"]);
    expect([...getChangedSections(withGenerations({ enabledSensors: [] }), base)]).toEqual(["sensors"]);
    expect([...getChangedSections(withController({ ACTION_COSTS: { MoveNorth: 9 } }), base)]).toEqual(["actions"]);
    expect([...getChangedSections({ ...base, waterData: { ...base.waterData, waterCellCapacity: 99 } }, base)])
      .toEqual(["world"]);
    expect([...getChangedSections(withController({ MASS_COST_PER_SENSOR: 99 }), base)]).toEqual(["constants"]);
    expect([...getChangedSections({ ...base, constants: { ...base.constants, colors: {} } }, base)])
      .toEqual(["constants"]);
  });

  it("sees map changes but not a copy of the same map", () => {
    expect(getChangedSections({ ...base, worldObjects: [...base.worldObjects] }, base).size).toBe(0);
    expect([...getChangedSections({ ...base, worldObjects: base.worldObjects.slice(1) }, base)]).toEqual(["world"]);
  });
});
