import WorldController from "../world/WorldController";

/** A row of the SETUP block of the log: a Settings value or a constant */
export interface SetupParam {
  eventType: "SETTING" | "CONSTANT";
  name: string;
  value: number | string;
}

type Leaf = number | string | boolean | null | undefined;

// numbers go to ParamValue, booleans as 1 or 0, the rest as text
const toValue = (value: Leaf): number | string =>
  typeof value === "boolean" ? (value ? 1 : 0) : typeof value === "number" ? value : String(value ?? "");

// nested objects and arrays become one row per value, named with a path ("LOG_ALLOWED_EVENTS.MOVE")
function flatten(name: string, value: unknown, out: SetupParam[]): void {
  if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) flatten(`${name}.${key}`, item, out);
  } else {
    out.push({ eventType: "CONSTANT", name, value: toValue(value as Leaf) });
  }
}

/**
 * The configuration of the running simulation, as the log writes it: every value of the
 * Settings tab (sensors and actions as 1 or 0, in table order), then every constant
 * (the upper case values of worldControllerData and the constants object).
 */
export default function setupParams(worldController: WorldController): SetupParam[] {
  const { worldControllerData: wc, worldGenerationsData: wg, waterData, constants } = worldController.simData;
  const settings: [string, Leaf][] = [
    // World
    ["simCode", worldController.simCode],
    ["phenotypeColorMode", wg.phenotypeColorMode],
    ["metabolismEnabled", wg.metabolismEnabled],
    ["size", wc.size],
    ["initialPopulation", wg.initialPopulation],
    ["stepsPerGen", wc.stepsPerGen],
    // the seed of the draft (empty when random) and the one this run uses
    ["seed", wc.seed ?? "random"],
    ["runSeed", worldController.seed],
    // Generations
    ["simulationType", wg.simulationType],
    ["maxAge", wg.maxAge],
    ["populationStrategy", wg.populationStrategy.name],
    ["selectionMethod", wg.selectionMethod.name],
    // Neural networks
    ["initialGenomeSize", wg.initialGenomeSize],
    ["maxGenomeSize", wg.maxGenomeSize],
    ["maxNumberNeurons", wg.maxNumberNeurons],
    // Mutations
    ["mutationMode", wg.mutationMode],
    ["mutationProbability", wg.mutationProbability],
    ["geneInsertionDeletionProbability", wg.geneInsertionDeletionProbability],
    ["deletionRatio", wg.deletionRatio],
    // Sensors and actions, in the order of their tables
    ...Object.keys(worldController.generations.sensors.data).map(
      (name): [string, Leaf] => [`sensor.${name}`, wg.enabledSensors.includes(name as never)]),
    ...Object.keys(worldController.generations.actions.data).map(
      (name): [string, Leaf] => [`action.${name}`, wg.enabledActions.includes(name as never)]),
    // Water
    ["waterCellCapacity", waterData.waterCellCapacity],
    ["waterTotalPerCell", waterData.waterTotalPerCell],
    ["waterRainMaxPerCell", waterData.waterRainMaxPerCell],
    ["waterFirstRainPerCell", waterData.waterFirstRainPerCell],
    ["waterEvaporationPerCellPerGeneration", waterData.waterEvaporationPerCellPerGeneration],
    ["rainType", waterData.rainType],
  ];

  const params: SetupParam[] = settings.map(([name, value]) => ({ eventType: "SETTING", name, value: toValue(value) }));
  for (const [name, value] of Object.entries(wc)) {
    if (/^[A-Z][A-Z0-9_]*$/.test(name)) flatten(name, value, params);
  }
  for (const [name, value] of Object.entries(constants ?? {})) flatten(name, value, params);
  return params;
}
