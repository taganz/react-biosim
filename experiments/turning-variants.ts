/*
 * Turning under Greatest Distance: tries two engine changes without touching the engine,
 * by patching Creature at run time.
 *
 *   npx tsx experiments/turning-variants.ts <name> <seed> <forwardFix 0|1> <noPenalty 0|1> <bigGenome 0|1> [generations]
 *
 * forwardFix  a failed move sets lastMovement to 0, so MoveForward stops pushing into a wall
 *             (the engine does it since November 2026, so 0 and 1 now run the same)
 * noPenalty   standing still does not take points away from the distance index
 * bigGenome   8 to 12 genes and 2 neurons, instead of the startup 4 genes and 1 neuron
 *
 * Writes results/<name>/turning.csv, one row per generation:
 *   maxIndex       largest distance index
 *   survIndex      mean distance index of the survivors
 *   survMoves      mean cells moved by the survivors
 *   survReversals  mean number of times a survivor moved in the opposite direction of its previous move
 *   turners        share of survivors with at least one reversal
 *   wallShare      share of the survivors' reversals made within 3 cells of a border
 * and prints the most common survivor genome of the last generation.
 */
import fs from "node:fs";
import path from "node:path";
import { runHeadless } from "@/simulation/headless/runHeadless";
import GreatestDistanceSelection from "@/simulation/generations/selection/GreatestDistanceSelection";
import CreatureClass from "@/simulation/creature/Creature";
import WorldGenerations from "@/simulation/generations/WorldGenerations";
type Creature = CreatureClass;

const [name, seedArg, forwardArg, penaltyArg, genomeArg, gensArg] = process.argv.slice(2);
if (!name || !seedArg || !forwardArg || !penaltyArg || !genomeArg) {
  console.error("Usage: npx tsx experiments/turning-variants.ts <name> <seed> <forwardFix 0|1> <noPenalty 0|1> <bigGenome 0|1> [generations]");
  process.exit(1);
}
const generationsToRun = Number(gensArg ?? 200);
let lastGenome = "";
const forwardFix = forwardArg === "1";
const noPenalty = penaltyArg === "1";
const bigGenome = genomeArg === "1";

const proto = CreatureClass.prototype as any;

if (forwardFix) {
  const move = proto.move;
  proto.move = function (this: Creature, x: number, y: number): boolean {
    const moved = move.call(this, x, y);
    if (!moved) {
      this.lastMovement[0] = 0;
      this.lastMovement[1] = 0;
    }
    return moved;
  };
}

// the same as Creature.computeDistanceIndex, without the points taken away for standing still
if (noPenalty) {
  proto.computeDistanceIndex = function (this: Creature) {
    if (this.lastPosition[0] == this.position[0] && this.lastPosition[1] == this.position[1]) {
      this.stepsStopped += 1;
      return;
    }
    this.stepsStopped = 0;
    if (this.stepDirection != null && this.lastDirection == this.stepDirection) {
      if (this.distancePartial < 120) this.distancePartial += 1;
      if (this.distancePartial > 35) this.distanceCovered += 1;
    } else {
      this.distancePartial = 0;
    }
  };
}

// movement statistics, counted in computeDistanceIndex, which runs once per step after the move
type Stats = { moves: number; reversals: number; wallReversals: number; prev: string | null };
const stats = new WeakMap<Creature, Stats>();
const opposite: Record<string, string> = { N: "S", S: "N", E: "W", W: "E", NE: "SW", SW: "NE", NW: "SE", SE: "NW" };
const computeDistanceIndex = proto.computeDistanceIndex;
proto.computeDistanceIndex = function (this: Creature) {
  let s = stats.get(this);
  if (!s) { s = { moves: 0, reversals: 0, wallReversals: 0, prev: null }; stats.set(this, s); }
  if (this.position[0] !== this.lastPosition[0] || this.position[1] !== this.lastPosition[1]) {
    s.moves++;
    if (s.prev && opposite[s.prev] === this.stepDirection) {
      s.reversals++;
      const size = this.generations.worldController.size;
      const [x, y] = this.lastPosition;
      if (Math.min(x, y, size - 1 - x, size - 1 - y) <= 3) s.wallReversals++;
    }
    s.prev = this.stepDirection as string;
  }
  return computeDistanceIndex.call(this);
};

const rows: string[] = ["generation;maxIndex;survIndex;survMoves;survReversals;turners;wallShare"];
const getSurvivors = GreatestDistanceSelection.prototype.getSurvivors;
GreatestDistanceSelection.prototype.getSurvivors = function (generations: WorldGenerations) {
  const result = getSurvivors.call(this, generations);
  const survivors = result.survivors;
  const n = Math.max(1, survivors.length);
  const of = (c: Creature) => stats.get(c) ?? { moves: 0, reversals: 0, wallReversals: 0, prev: null };
  const mean = (f: (c: Creature) => number) => (survivors.reduce((t, c) => t + f(c), 0) / n).toFixed(2);
  rows.push([
    generations.worldController.currentGen,
    result.fitnessMaxValue,
    mean((c) => c.distanceCovered),
    mean((c) => of(c).moves),
    mean((c) => of(c).reversals),
    mean((c) => (of(c).reversals > 0 ? 1 : 0)),
    (() => {
      const total = survivors.reduce((t, c) => t + of(c).reversals, 0);
      return total > 0 ? (survivors.reduce((t, c) => t + of(c).wallReversals, 0) / total).toFixed(2) : "";
    })(),
  ].join(";"));
  if (generations.worldController.currentGen === generationsToRun) {
    const counts = new Map<string, number>();
    for (const c of survivors) {
      const genome = c.brain.genome.toString(generations).replace(/\s+/g, " ").trim();
      counts.set(genome, (counts.get(genome) ?? 0) + 1);
    }
    const [genome, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
    lastGenome = `${count}x ${genome}`;
  }
  return result;
};

const worldGenerationsData: Record<string, unknown> = { selectionMethod: "GreatestDistanceSelection" };
if (bigGenome) Object.assign(worldGenerationsData, { initialGenomeSize: 8, maxGenomeSize: 12, maxNumberNeurons: 2 });

runHeadless({ base: "startup", generations: generationsToRun, seed: Number(seedArg), overrides: { worldGenerationsData } }).then((result) => {
  const out = path.join("results", name);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "turning.csv"), rows.join("\n") + "\n");
  console.log(`${name}: ${result.status}, ${rows.length - 1} generations`);
  console.log(lastGenome);
});
