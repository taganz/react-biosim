import type Creature from "../creature/Creature";
import type WorldGenerations from "../generations/WorldGenerations";
import { creatureMassBalance, MassBalance, SpeciesStats, speciesStatsOf } from "../generations/creatureQueries";
import type { SpeciesRecord } from "../generations/SpeciesRegistry";
import { getUsedSensorsAndActions } from "../creature/brain/Helpers/networkLabels";
import type { DeathCause } from "../creature/Creature";

/** a value of a log cell: numbers are formatted with the locale, booleans as 1 or 0, null is empty */
export type LogValue = number | string | boolean | null;

/** where and when a row is written */
export interface RowContext {
  simCode: string;
  generation: number;
  step: number;
}

export interface Column<T> {
  name: string;
  value: (item: T, context: RowContext) => LogValue;
}

/** creature key: unique in a run, because ids can restart every generation */
export const creatureKey = (birthGen: number, id: number): string => `${birthGen}-${id}`;

const BALANCE_KEYS: (keyof MassBalance)[] = [
  "start", "photosynthesis", "fromPrey", "basal", "thinking", "moving", "attacking",
  "reproductionCost", "givenToChildren", "end",
];
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const usedNames = (creature: Creature) => {
  const { sensors, actions } = getUsedSensorsAndActions(creature);
  return { sensors: Array.from(sensors).join("|"), actions: Array.from(actions).join("|") };
};

const contextColumns = <T>(): Column<T>[] => [
  { name: "simCode", value: (_, context) => context.simCode },
  { name: "generation", value: (_, context) => context.generation },
  { name: "step", value: (_, context) => context.step },
];

export interface CreatureColumnOptions {
  /** add the genome of each creature (it is also in the log of species) */
  genome: boolean;
}

/** The columns of the log of creatures: one row per creature and recording */
export function creatureColumns(options: CreatureColumnOptions): Column<Creature>[] {
  // the mass balance and the used sensors are computed once per row
  let balanceOf: { creature: Creature | null; balance: MassBalance | null } = { creature: null, balance: null };
  const balance = (creature: Creature) => {
    if (balanceOf.creature !== creature) balanceOf = { creature, balance: creatureMassBalance(creature) };
    return balanceOf.balance!;
  };
  let usedOf: { creature: Creature | null; used: { sensors: string; actions: string } | null } = { creature: null, used: null };
  const used = (creature: Creature) => {
    if (usedOf.creature !== creature) usedOf = { creature, used: usedNames(creature) };
    return usedOf.used!;
  };

  const columns: Column<Creature>[] = [
    ...contextColumns<Creature>(),
    { name: "creatureKey", value: (c) => creatureKey(c.birthGen, c.id) },
    { name: "id", value: (c) => c.id },
    { name: "birthGen", value: (c) => c.birthGen },
    { name: "stepBirth", value: (c) => c.stepBirth },
    { name: "speciesId", value: (c) => c.speciesId },
    { name: "speciesParentId", value: (c) => c.speciesParentId },
    { name: "genus", value: (c) => c.genus },
    { name: "genomeColor", value: (c) => c.genomeColorCode },
    { name: "parentKey", value: (c) => c.parentId === null ? null : creatureKey(c.parentBirthGen ?? 0, c.parentId) },
    { name: "spawnZone", value: (c) => c.spawnZone },
    { name: "alive", value: (c) => c.isAlive },
    { name: "age", value: (c) => c._age },
    { name: "mass", value: (c) => c.isAlive ? c.mass : 0 },
    { name: "massAtBirth", value: (c) => c.massAtBirth },
    { name: "health", value: (c) => Math.max(0, c.health) },
    { name: "x", value: (c) => c.position[0] },
    { name: "y", value: (c) => c.position[1] },
    { name: "lastMoveX", value: (c) => c.lastMovement[0] },
    { name: "lastMoveY", value: (c) => c.lastMovement[1] },
    { name: "lastDirection", value: (c) => c.lastDirection },
    { name: "distanceCovered", value: (c) => c.distanceCovered },
    { name: "stepsStopped", value: (c) => c.stepsStopped },
    { name: "canMove", value: (c) => c.isAlive && c.hasEnoughMassToMove() },
    { name: "canReproduce", value: (c) => c.isAlive && c.reproduction.hasEnoughtMassToReproduce },
    { name: "stamina", value: (c) => c.brain.stamina },
    { name: "children", value: (c) => c.childrenCount },
    { name: "kills", value: (c) => c.killCount },
    { name: "attacks", value: (c) => c.attackCount },
    { name: "thinkCount", value: (c) => c.thinkCount },
    { name: "waterFromPhotosynthesis", value: (c) => c.waterFromPhotosynthesis },
    { name: "waterFromPrey", value: (c) => c.waterFromPrey },
    ...BALANCE_KEYS.map((key): Column<Creature> => ({ name: `mass${capitalize(key)}`, value: (c) => balance(c)[key] })),
    { name: "deathCause", value: (c) => c.deathCause },
    { name: "deathGen", value: (c) => c.deathGen },
    { name: "deathStep", value: (c) => c.deathStep },
    { name: "killedBySpecies", value: (c) => c.killedBySpecies },
    { name: "genomeSize", value: (c) => c.brain.genome.genes.length },
    { name: "usedSensors", value: (c) => used(c).sensors },
    { name: "usedActions", value: (c) => used(c).actions },
  ];
  if (options.genome) columns.push({ name: "genome", value: (c) => c.brain.genome.toHexadecimalString() });
  return columns;
}

/** A species with what the log of species writes of it */
export interface SpeciesSnapshot {
  record: SpeciesRecord;
  stats: SpeciesStats;
  living: Creature[];
  /** a living (or dead) creature of the species, for its network */
  sample: Creature | null;
  /** living creatures of the whole world */
  worldAlive: number;
}

export interface SpeciesColumnOptions {
  /** add the keys of its living creatures */
  creatureList: boolean;
}

const DEATH_CAUSES: DeathCause[] = ["old", "basalConsumption", "attacked", "health"];

/** The columns of the log of species: one row per species and recording */
export function speciesColumns(options: SpeciesColumnOptions): Column<SpeciesSnapshot>[] {
  let usedOf: { sample: Creature | null; used: { sensors: string; actions: string } } = { sample: null, used: { sensors: "", actions: "" } };
  const used = (s: SpeciesSnapshot) => {
    if (!s.sample) return { sensors: "", actions: "" };
    if (usedOf.sample !== s.sample) usedOf = { sample: s.sample, used: usedNames(s.sample) };
    return usedOf.used;
  };
  const deathShare = (s: SpeciesSnapshot, cause: DeathCause) =>
    s.stats.died > 0 ? s.stats.deathCauses.find((entry) => entry.cause === cause)?.percentage ?? 0 : null;

  const columns: Column<SpeciesSnapshot>[] = [
    ...contextColumns<SpeciesSnapshot>(),
    { name: "speciesId", value: (s) => s.record.id },
    { name: "speciesParentId", value: (s) => s.record.parentId },
    { name: "firstGen", value: (s) => s.record.firstGen },
    { name: "genus", value: (s) => s.record.genus },
    { name: "genomeColor", value: (s) => s.record.genome.getHexColor() },
    { name: "genomeSize", value: (s) => s.record.genome.genes.length },
    { name: "usedSensors", value: (s) => used(s).sensors },
    { name: "usedActions", value: (s) => used(s).actions },
    { name: "alive", value: (s) => s.stats.alive },
    { name: "percentOfPopulation", value: (s) => s.worldAlive > 0 ? (100 * s.stats.alive) / s.worldAlive : 0 },
    { name: "peakAlive", value: (s) => s.record.peakAlive },
    { name: "started", value: (s) => s.stats.started },
    { name: "born", value: (s) => s.stats.bornSince },
    { name: "died", value: (s) => s.stats.died },
    { name: "avgAge", value: (s) => s.stats.living?.age ?? null },
    { name: "avgMass", value: (s) => s.stats.living?.mass ?? null },
    { name: "avgHealth", value: (s) => s.stats.living?.health ?? null },
    { name: "avgDistance", value: (s) => s.stats.living?.distance ?? null },
    { name: "avgStepsStopped", value: (s) => s.stats.living?.stepsStopped ?? null },
    { name: "pctCanMove", value: (s) => s.stats.living?.canMove ?? null },
    { name: "pctCanReproduce", value: (s) => s.stats.living?.canReproduce ?? null },
    { name: "avgChildren", value: (s) => s.stats.perCreature?.children ?? null },
    { name: "avgKills", value: (s) => s.stats.perCreature?.kills ?? null },
    { name: "avgAttacks", value: (s) => s.stats.perCreature?.attacks ?? null },
    { name: "avgPhotosynthesis", value: (s) => s.stats.perCreature?.photosynthesis ?? null },
    { name: "avgFromPrey", value: (s) => s.stats.perCreature?.fromPrey ?? null },
    ...BALANCE_KEYS.map((key): Column<SpeciesSnapshot> => ({
      name: `avgMass${capitalize(key)}`, value: (s) => s.stats.perCreature?.balance[key] ?? null,
    })),
    { name: "avgAgeAtDeath", value: (s) => s.stats.averageAgeAtDeath },
    ...DEATH_CAUSES.map((cause): Column<SpeciesSnapshot> => ({
      name: `pctDeath${capitalize(cause)}`, value: (s) => deathShare(s, cause),
    })),
  ];
  if (options.creatureList) {
    columns.push({
      name: "aliveCreatures",
      value: (s) => s.living.map((c) => creatureKey(c.birthGen, c.id)).join("|"),
    });
  }
  columns.push({ name: "genome", value: (s) => s.record.genome.toHexadecimalString() });
  return columns;
}

/**
 * The species seen in the current generation (also the extinct ones) with their stats.
 * onlyIds: keep only these species.
 */
export function speciesSnapshots(generations: WorldGenerations, onlyIds?: ReadonlySet<string>): SpeciesSnapshot[] {
  const livingById = new Map<string, Creature[]>();
  let worldAlive = 0;
  for (const creature of generations.currentCreatures) {
    if (!creature.isAlive) continue;
    worldAlive++;
    if (onlyIds && !onlyIds.has(creature.speciesId)) continue;
    let list = livingById.get(creature.speciesId);
    if (!list) livingById.set(creature.speciesId, list = []);
    list.push(creature);
  }
  const deadById = new Map<string, Creature[]>();
  for (const creature of generations.speciesRegistry.deadThisGeneration) {
    if (onlyIds && !onlyIds.has(creature.speciesId)) continue;
    let list = deadById.get(creature.speciesId);
    if (!list) deadById.set(creature.speciesId, list = []);
    list.push(creature);
  }
  const snapshots: SpeciesSnapshot[] = [];
  for (const record of generations.speciesRegistry.species) {
    if (onlyIds && !onlyIds.has(record.id)) continue;
    const living = livingById.get(record.id) ?? [];
    const dead = deadById.get(record.id) ?? [];
    snapshots.push({
      record,
      stats: speciesStatsOf(living, dead, record.started, record.born),
      living,
      sample: living[0] ?? dead[0] ?? null,
      worldAlive,
    });
  }
  // the largest first, then by id so the order does not depend on the map
  return snapshots.sort((a, b) => b.stats.alive - a.stats.alive || (a.record.id < b.record.id ? -1 : 1));
}
