import { SimulationData } from "@/simulation/SimulationData";
import { serializeObjects } from "@/simulation/serialization/formatters/objectsSerialization";

export type ScenarioSection =
  | "world"
  | "generations"
  | "networks"
  | "mutations"
  | "sensors"
  | "actions"
  | "constants";

// values are plain data, except the map objects, which are compared in their saved form
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

// worldControllerData fields edited outside the Constants section; the map and water are in World
const WORLD_CONTROLLER_KEYS: Record<string, ScenarioSection> = {
  size: "world",
  stepsPerGen: "generations",
  SENSOR_COSTS: "sensors",
  ACTION_COSTS: "actions",
};

/**
 * The sections of the Scenario tab whose fields differ between the draft and the running
 * simulation, so a closed section can show that it holds changes that are not applied.
 */
export function getChangedSections(draft: SimulationData, applied: SimulationData): Set<ScenarioSection> {
  const changed = new Set<ScenarioSection>();
  if (draft === applied) return changed;

  const gen = draft.worldGenerationsData;
  const appliedGen = applied.worldGenerationsData;
  const genChanged = (...keys: (keyof typeof gen)[]) => keys.some((key) => !same(gen[key], appliedGen[key]));

  if (
    genChanged("initialPopulation", "metabolismEnabled", "simulationType", "maxAge") ||
    gen.populationStrategy.name !== appliedGen.populationStrategy.name ||
    gen.selectionMethod.name !== appliedGen.selectionMethod.name ||
    !same(draft.constants?.POPULATION_DEFAULT_GENUS, applied.constants?.POPULATION_DEFAULT_GENUS)
  ) changed.add("generations");
  if (genChanged("initialGenomeSize", "maxGenomeSize", "maxNumberNeurons")) changed.add("networks");
  if (genChanged("mutationMode", "mutationProbability", "geneInsertionDeletionProbability")) changed.add("mutations");
  if (genChanged("enabledSensors")) changed.add("sensors");
  if (genChanged("enabledActions")) changed.add("actions");

  if (
    draft.worldObjects !== applied.worldObjects &&
    !same(serializeObjects(draft.worldObjects), serializeObjects(applied.worldObjects))
  ) changed.add("world");

  if (!same(draft.waterData, applied.waterData)) changed.add("world");

  // every other worldControllerData field and constant is in the Constants section
  const controller = draft.worldControllerData as unknown as Record<string, unknown>;
  const appliedController = applied.worldControllerData as unknown as Record<string, unknown>;
  for (const key of new Set([...Object.keys(controller), ...Object.keys(appliedController)])) {
    if (!same(controller[key], appliedController[key])) changed.add(WORLD_CONTROLLER_KEYS[key] ?? "constants");
  }
  const constants = draft.constants ?? {};
  const appliedConstants = applied.constants ?? {};
  for (const key of new Set([...Object.keys(constants), ...Object.keys(appliedConstants)])) {
    if (key !== "POPULATION_DEFAULT_GENUS" && !same(constants[key], appliedConstants[key])) changed.add("constants");
  }

  return changed;
}
