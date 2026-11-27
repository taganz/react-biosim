import { SavedSimulationData } from "./data/SavedSimulationData";
import migrateLogConstants from "@/simulation/log/migrateLogConstants";
import { startUpScenarioSimulationData as startup } from "@/simulation/startupScenario";
import { NeuronType } from "@/simulation/creature/brain/Neuron";

/** Version written by the serializers. Files without a version are version 1 */
export const SAVE_FORMAT_VERSION = 3;

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
  const version2 = version < 2 ? fromVersion1(parsed) : parsed;
  const current = version < 3 ? fromVersion2(version2) : version2;
  // the constants of the event logger can be in files of any version
  const constants = migrateLogConstants(current.constants);
  return constants === current.constants ? current : { ...current, constants };
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
    version: 2,
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

// the action table up to version 2. Genes address actions by their position in the enabled
// list, which follows this order, and wrap the id with the number of enabled actions
const VERSION_2_ACTIONS = ["MoveNorth", "MoveSouth", "MoveEast", "MoveWest", "RandomMove", "MoveForward",
  "Photosynthesis", "Reproduction", "AttackPlant", "AttackAnimal", "Stamina", "MoveToPrey"];
const VERSION_3_ACTIONS = ["MoveNorth", "MoveSouth", "MoveEast", "MoveWest", "RandomMove", "MoveForward",
  "Photosynthesis", "Reproduction", "Attack", "Stamina", "MoveToPrey"];
const toVersion3Action = (name: string) => name === "AttackPlant" || name === "AttackAnimal" ? "Attack" : name;

// version 2: AttackPlant and AttackAnimal did the same and are now one Attack action, and the
// carnivore genus (attack_animal) is gone: what was a carnivore is an animal (attack_plant).
// Files with the even older Attack action, which versions 1 and 2 ignored, get it back: their
// genes were made with it in the list, so they are kept as they are
function fromVersion2(parsed: any): SavedSimulationData {
  const generations = parsed.worldGenerationsData;
  const savedActions: string[] = generations.enabledActions ?? [];
  const hasAttackAction = savedActions.includes("AttackPlant") || savedActions.includes("AttackAnimal");
  const oldActions = VERSION_2_ACTIONS.filter((name) => savedActions.includes(name));
  const newNames = savedActions.map(toVersion3Action);
  const newActions = VERSION_3_ACTIONS.filter((name) => newNames.includes(name));

  // a gene that drives an action points to the same action, under its new position
  const migrateGene = (gene: number): number => {
    if (((gene >> 23) & 1) !== NeuronType.ACTION) return gene;
    const target = toVersion3Action(oldActions[((gene >> 16) & 127) % oldActions.length]);
    const newId = newActions.indexOf(target);
    if (((gene >> 16) & 127) % newActions.length === newId) return gene;
    const migrated = (gene & ~(127 << 16)) | (newId << 16);
    // genes are saved signed or unsigned: keep the sign convention of the file
    return gene < 0 ? migrated : migrated >>> 0;
  };
  const migrateGenes = (genes: number[]) => hasAttackAction ? genes.map(migrateGene) : genes;

  const { MASS_AT_BIRTH_ATTACK_ANIMAL, ...controller } = parsed.worldControllerData;
  const { attack_animal, ...efficiency } = controller.ASSIMILATION_EFFICIENCY ?? {};
  const { AttackPlant, AttackAnimal, ...actionCosts } = controller.ACTION_COSTS ?? {};
  const attackCost = AttackPlant ?? AttackAnimal;

  return {
    ...parsed,
    version: SAVE_FORMAT_VERSION,
    constants: parsed.constants?.POPULATION_DEFAULT_GENUS === undefined ? parsed.constants : {
      ...parsed.constants,
      POPULATION_DEFAULT_GENUS: mergeCarnivoreProbability(parsed.constants.POPULATION_DEFAULT_GENUS),
    },
    worldGenerationsData: {
      ...generations,
      enabledActions: newActions,
      plantGenes: migrateGenes(generations.plantGenes ?? []),
    },
    worldControllerData: {
      ...controller,
      ...(controller.ASSIMILATION_EFFICIENCY === undefined ? {} : { ASSIMILATION_EFFICIENCY: efficiency }),
      ...(controller.ACTION_COSTS === undefined ? {} : {
        ACTION_COSTS: attackCost === undefined ? actionCosts : { ...actionCosts, Attack: attackCost },
      }),
    },
    species: parsed.species?.map((species: any) => ({ ...species, genes: migrateGenes(species.genes) })),
    startGenomes: parsed.startGenomes?.map((genome: any) => ({ ...genome, genes: migrateGenes(genome.genes) })),
  };
}

// the share of carnivores goes to animals (attack_plant)
function mergeCarnivoreProbability(genera: { genus: string, probability: number }[]) {
  const carnivores = genera.filter(({ genus }) => genus === "attack_animal").reduce((sum, { probability }) => sum + probability, 0);
  const rest = genera.filter(({ genus }) => genus !== "attack_animal");
  if (carnivores === 0) return rest;
  if (!rest.some(({ genus }) => genus === "attack_plant")) return [...rest, { genus: "attack_plant", probability: carnivores }];
  return rest.map((item) => item.genus === "attack_plant" ? { ...item, probability: item.probability + carnivores } : item);
}
