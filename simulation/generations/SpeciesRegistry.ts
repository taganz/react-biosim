import type Creature from "../creature/Creature";
import type Genome from "../creature/brain/Genome";
import type { Genus } from "../creature/CreatureGenus";

/** What the engine knows of a species during the current generation (see speciesId.ts) */
export interface SpeciesRecord {
  id: string;
  /** the species it came from, null for a root */
  parentId: string | null;
  genome: Genome;
  genus: Genus;
  /** generation in which it appeared */
  firstGen: number;
  alive: number;
  /** creatures it had when the generation (or time window) started */
  started: number;
  /** creatures born during the generation */
  born: number;
  /** creatures that died during the generation */
  died: number;
  /** most creatures alive at once during the generation */
  peakAlive: number;
}

/**
 * The species seen in the current generation, also the ones that are already extinct, so the
 * log can write a row for a species that appeared and died out between two recordings.
 * Updated at every birth and death; extinct species are dropped when the next generation starts.
 * It also keeps the creatures that died in the generation, for the log of creatures.
 */
export default class SpeciesRegistry {
  private records = new Map<string, SpeciesRecord>();
  /** creatures that died in the current generation, in order of death */
  deadThisGeneration: Creature[] = [];
  /** placing: added creatures are the start of a generation, not births; restoring: they only
   *  count as alive (a hot change rebuilds the creatures of the same generation) */
  private mode: "births" | "placing" | "restoring" = "births";

  get species(): IterableIterator<SpeciesRecord> {
    return this.records.values();
  }

  get(id: string): SpeciesRecord | undefined {
    return this.records.get(id);
  }

  get size(): number {
    return this.records.size;
  }

  /** a creature entered the world: a birth, or one placed at the start of a generation */
  addCreature(creature: Creature, firstGen: number = creature.generations.currentGen): void {
    let record = this.records.get(creature.speciesId);
    if (!record) {
      record = {
        id: creature.speciesId,
        parentId: creature.speciesParentId,
        genome: creature.brain.genome,
        genus: creature.genus,
        firstGen,
        alive: 0, started: 0, born: 0, died: 0, peakAlive: 0,
      };
      this.records.set(record.id, record);
    }
    record.alive++;
    if (this.mode === "placing") record.started++;
    else if (this.mode === "births") record.born++;
    if (record.alive > record.peakAlive) record.peakAlive = record.alive;
  }

  removeDeadCreature(creature: Creature): void {
    const record = this.records.get(creature.speciesId);
    if (record) {
      record.alive--;
      record.died++;
    }
    this.deadThisGeneration.push(creature);
  }

  /**
   * Starts placing the creatures of a generation: nothing is alive, the counters start again.
   * The records are kept, so a species that goes on keeps its first generation.
   */
  beginPlacing(): void {
    this.mode = "placing";
    this.deadThisGeneration = [];
    for (const record of this.records.values()) {
      record.alive = record.started = record.born = record.died = record.peakAlive = 0;
    }
  }

  /** the creatures of the generation are placed: species without any are dropped */
  endPlacing(): void {
    this.mode = "births";
    this.dropExtinct();
  }

  /**
   * A hot change rebuilds the creatures in the same generation: the counters and the dead are
   * kept, and only the living are counted again. Species left without creatures stay until the
   * generation ends, like the ones that died out.
   */
  beginRestoring(): void {
    this.mode = "restoring";
    for (const record of this.records.values()) record.alive = 0;
  }

  endRestoring(): void {
    this.mode = "births";
  }

  /** continuous runs: a new time window starts with the living creatures */
  startTimeWindow(): void {
    this.deadThisGeneration = [];
    this.dropExtinct();
    for (const record of this.records.values()) {
      record.started = record.peakAlive = record.alive;
      record.born = record.died = 0;
    }
  }

  /** the generation a species appeared in, for creatures restored from a file or a hot change */
  firstGenOf(id: string): number | undefined {
    return this.records.get(id)?.firstGen;
  }

  private dropExtinct(): void {
    for (const [id, record] of this.records) {
      if (record.alive <= 0) this.records.delete(id);
    }
  }
}
