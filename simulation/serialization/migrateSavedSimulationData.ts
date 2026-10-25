import { SavedSimulationData } from "./data/SavedSimulationData";
import migrateLogConstants from "@/simulation/logger/migrateLogConstants";
import { startUpScenarioSimulationData as startup } from "@/simulation/startupScenario";

/** Version written by the serializers. Files without a version are version 1 */
export const SAVE_FORMAT_VERSION = 2;

// Older files had a Continuous population strategy and a Continuous selection method
// instead of a simulation type. They load as a continuous run; Random Fixed Genera builds
// generation 1 as the old Continuous strategy did.
const LEGACY_CONTINUOUS_POPULATION = "ContinuousPopulation";
const LEGACY_CONTINUOUS_SELECTION = "ContinuousSelection";
const DEFAULT_MAX_AGE = 1000;

/**
 * Brings a parsed file of any version to the current format. Every change for older files
 * is here, so the deserializers only read the current format.
 */
export default function migrateSavedSimulationData(parsed: any): SavedSimulationData {
  if (parsed === null || typeof parsed !== "object" || !parsed.worldGenerationsData || !parsed.worldControllerData) {
    throw new Error("it is not a simulation file.");
  }
  const version = parsed.version ?? 1;
  if (version > SAVE_FORMAT_VERSION) {
    throw new Error(`it was saved by a newer version of the app (format ${version}, this one reads up to ${SAVE_FORMAT_VERSION}).`);
  }
  return version < 2 ? fromVersion1(parsed) : parsed;
}

// version 1: files saved before October 2026, and hand-written scenarios.
// The oldest ones, from before metabolism and water, have no constants and no water settings,
// and keep the map objects in worldControllerData: missing settings take the startup values
function fromVersion1(parsed: any): SavedSimulationData {
  const generations = parsed.worldGenerationsData;
  const isLegacyContinuous = generations.populationStrategy === LEGACY_CONTINUOUS_POPULATION
    || generations.selectionMethod === LEGACY_CONTINUOUS_SELECTION;

  // ATTACK_MULTIPLE_MASS_AT_BIRTH and MASS_COST_PER_EXECUTE_ACTION no longer exist
  const { ATTACK_MULTIPLE_MASS_AT_BIRTH, MASS_COST_PER_EXECUTE_ACTION, worldObjects, initialPopulation, waterFirstRainPerCell, ...savedController } = parsed.worldControllerData;
  const controller = { ...startup.worldControllerData, ...savedController };

  return {
    ...parsed,
    version: SAVE_FORMAT_VERSION,
    constants: parsed.constants === undefined ? { ...startup.constants } : migrateLogConstants(parsed.constants),
    worldObjects: parsed.worldObjects ?? worldObjects ?? [],
    waterData: {
      ...startup.waterData,
      ...(waterFirstRainPerCell === undefined ? {} : { waterFirstRainPerCell }),
      ...parsed.waterData,
    },
    worldGenerationsData: {
      ...generations,
      simulationType: generations.simulationType ?? (isLegacyContinuous ? "continuous" : "generational"),
      maxAge: generations.maxAge ?? DEFAULT_MAX_AGE,
      populationStrategy: generations.populationStrategy === LEGACY_CONTINUOUS_POPULATION
        ? "RandomFixedGenePopulation" : generations.populationStrategy,
      selectionMethod: generations.selectionMethod === LEGACY_CONTINUOUS_SELECTION
        ? "InsideReproductionAreaSelection" : generations.selectionMethod,
      // a JSON string in version 1, and missing in files older than the setting
      plantGenes: typeof generations.plantGenes === "string" ? JSON.parse(generations.plantGenes) : generations.plantGenes ?? [],
    },
    worldControllerData: {
      ...controller,
      // attacks used ACTION_REPRODUCTION_OFFSET, and every gene cost MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE
      ACTION_ATTACK_OFFSET: controller.ACTION_ATTACK_OFFSET ?? controller.ACTION_REPRODUCTION_OFFSET,
      MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY: controller.MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY
        ?? controller.MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE,
    },
  };
}
