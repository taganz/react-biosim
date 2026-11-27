/*
 * Foraging pilot: do herbivores evolve to move in search of plants?
 *
 *   npx tsx experiments/forage-pilot.ts <name> <seed> <moveTry> <moveDo> [generations]
 *
 * Runs experiments/forage-pilot.json (Plant/Herbivore + Greatest Mass) through runHeadless,
 * with the move costs given, and measures the herbivores at every step.
 * Writes results/<name>/forage.csv (one row per generation) and final.sim.
 *
 * forage.csv columns:
 *   moveRate     share of herbivore-steps in which the herbivore changed cell
 *   movers       share of herbivores that moved at least 5 cells in the generation
 *   kills        mean plants eaten per herbivore
 *   eaters       share of herbivores that ate at least once
 *   meanMass     mean mass of the herbivores alive at the last step
 *   chaseGenes   share of herbivores whose genome links a prey sensor to the move of the same direction
 *                with a positive effect (directly, or through a neuron with a positive product of weights)
 *   anyMoveGenes share of herbivores with a gene driving a movement action
 *   photoGenes   share of herbivores with a gene driving Photosynthesis (a way to gain mass without eating)
 *   massPhoto, massNoPhoto, killsPhoto, killsNoPhoto   mean final mass and plants eaten, herbivores with / without that gene
 *   moveToPreyGenes share of herbivores with a gene driving the MoveToPrey action (not counted in chaseGenes)
 *   plantOrigin  share of herbivores whose lineage started with a plant parent (a plant that mutated into a herbivore)
 */
import fs from "node:fs";
import path from "node:path";
import { runHeadless } from "@/simulation/headless/runHeadless";
import { serializeSimulationData } from "@/simulation/serialization/formatters/simulationDataSerialization";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureClass from "@/simulation/creature/Creature";
import WorldGenerations from "@/simulation/generations/WorldGenerations";
type Creature = CreatureClass;
import type WorldController from "@/simulation/world/WorldController";

const [name, seedArg, moveTryArg, moveDoArg, gensArg] = process.argv.slice(2);
if (!name || !seedArg || !moveTryArg || !moveDoArg) {
  console.error("Usage: npx tsx experiments/forage-pilot.ts <name> <seed> <moveTry> <moveDo> [generations]");
  process.exit(1);
}
const generations = Number(gensArg ?? 300);
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "forage-pilot.json"), "utf8"));
config.overrides.worldControllerData.MOVE_COST_PER_MASS_TRY = Number(moveTryArg);
config.overrides.worldControllerData.MOVE_COST_PER_MASS_DO = Number(moveDoArg);
// WORLD_SIZE=200 spreads the same population over a larger world: sparser food
if (process.env.WORLD_SIZE) config.overrides.worldControllerData.size = Number(process.env.WORLD_SIZE);

const DIRS: [string, string][] = [
  ["PreyNorth", "MoveNorth"], ["PreySouth", "MoveSouth"], ["PreyEast", "MoveEast"], ["PreyWest", "MoveWest"],
];
const MOVES = new Set(["MoveNorth", "MoveSouth", "MoveEast", "MoveWest", "RandomMove", "MoveForward", "MoveToPrey"]);

function genomeTraits(wc: WorldController, creature: Creature) {
  const gens = wc.generations;
  const S = gens.sensors.enabledSensors.map(String);
  const A = gens.actions.enabledActions.map(String);
  const conns = creature.brain.genome.genes.map((g) => Genome.geneToConnection(g, gens));
  const sensorName = (c: (typeof conns)[number]) => (c.sourceType === 1 ? S[c.sourceId] : null);
  const actionName = (c: (typeof conns)[number]) => (c.sinkType === 1 ? A[c.sinkId] : null);
  let chase = false;
  for (const [sensor, move] of DIRS) {
    for (const c of conns) {
      if (sensorName(c) !== sensor) continue;
      if (actionName(c) === move && c.weight > 0) chase = true;
      if (c.sinkType === 0) {
        for (const d of conns) {
          if (d.sourceType === 0 && d.sourceId === c.sinkId && actionName(d) === move && c.weight * d.weight > 0) chase = true;
        }
      }
    }
  }
  return {
    chase,
    anyMove: conns.some((c) => MOVES.has(actionName(c) ?? "")),
    photo: conns.some((c) => actionName(c) === "Photosynthesis"),
    moveToPrey: conns.some((c) => actionName(c) === "MoveToPrey"),
  };
}

type Tracked = { creature: Creature; x: number; y: number; cells: number };
let tracked = new Map<number, Tracked>();
let herbivoreSteps = 0;
let moveSteps = 0;
let currentGen = -1;
const rows: string[] = ["generation;herbivores;moveRate;movers;kills;eaters;meanMass;maxMass;chaseGenes;anyMoveGenes;photoGenes;massPhoto;massNoPhoto;killsPhoto;killsNoPhoto;moveToPreyGenes;plantOrigin"];

// where each herbivore's lineage started: "plant" if a plant parent had a herbivore child (a mutation),
// "seed" if it has no parent (generation 1 or a start file); children inherit it from their parent
const herbivoreOrigin = new WeakMap<Creature, "plant" | "seed">();
const originalNewCreature = WorldGenerations.prototype.newCreature;
WorldGenerations.prototype.newCreature = function (this: WorldGenerations, ...args: Parameters<WorldGenerations["newCreature"]>) {
  const child = originalNewCreature.apply(this, args);
  const parent = args[3];
  if (child.genus === "attack_plant") {
    herbivoreOrigin.set(child, !parent ? "seed" : parent.genus === "plant" ? "plant" : herbivoreOrigin.get(parent) ?? "seed");
  }
  return child;
};

function groupStats(wc: WorldController, all: Tracked[]) {
  const stat = (photo: boolean) => {
    const g = all.filter((t) => genomeTraits(wc, t.creature).photo === photo);
    const alive = g.filter((t) => t.creature.isAlive);
    return [
      (alive.reduce((s, t) => s + t.creature.mass, 0) / Math.max(1, alive.length)).toFixed(2),
      (g.reduce((s, t) => s + t.creature.killCount, 0) / Math.max(1, g.length)).toFixed(2),
    ];
  };
  const [mp, kp] = stat(true), [mn, kn] = stat(false);
  return [mp, mn, kp, kn];
}

function finishGeneration(wc: WorldController) {
  const all = [...tracked.values()];
  if (all.length === 0) return;
  const alive = all.filter((t) => t.creature.isAlive);
  const traits = all.map((t) => genomeTraits(wc, t.creature));
  const share = (n: number) => (n / all.length).toFixed(3);
  const masses = alive.map((t) => t.creature.mass);
  rows.push([
    currentGen, all.length,
    (herbivoreSteps ? moveSteps / herbivoreSteps : 0).toFixed(3),
    share(all.filter((t) => t.cells >= 5).length),
    (all.reduce((s, t) => s + t.creature.killCount, 0) / all.length).toFixed(2),
    share(all.filter((t) => t.creature.killCount > 0).length),
    (masses.reduce((s, m) => s + m, 0) / Math.max(1, masses.length)).toFixed(2),
    Math.max(0, ...masses).toFixed(2),
    share(traits.filter((t) => t.chase).length),
    share(traits.filter((t) => t.anyMove).length),
    share(traits.filter((t) => t.photo).length),
    ...groupStats(wc, all),
    share(traits.filter((t) => t.moveToPrey).length),
    share(all.filter((t) => herbivoreOrigin.get(t.creature) === "plant").length),
  ].join(";"));
}

// The engine lets any genus photosynthesise: herbivores with a Photosynthesis gene then grow without eating.
// For this experiment only plants can (PLANTS_ONLY_PHOTOSYNTHESIS=0 turns this off).
if (process.env.PLANTS_ONLY_PHOTOSYNTHESIS !== "0") {
  const originalPhotosynthesis = CreatureClass.prototype.photosynthesis;
  CreatureClass.prototype.photosynthesis = function (this: Creature, input: number) {
    if (this.genus === "plant") originalPhotosynthesis.call(this, input);
  };
}

// FIXED_GENUS=1: a mutation that would change the genus (a plant child that gains Attack, say)
// is dropped and the child gets the parent's genome unchanged. Needs BASE_SIM (reads its action list).
if (process.env.FIXED_GENUS === "1" && process.env.BASE_SIM) {
  const actions: string[] = JSON.parse(fs.readFileSync(process.env.BASE_SIM, "utf8")).worldGenerationsData.enabledActions;
  const genusOf = (genes: number[]) => {
    const used = new Set(genes.filter((g) => ((g >>> 23) & 1) === 1).map((g) => actions[((g >>> 16) & 127) % actions.length]));
    return used.has("Attack") ? "attack_plant" : used.has("Photosynthesis") ? "plant" : "unknown";
  };
  const originalClone = Genome.prototype.clone;
  Genome.prototype.clone = function (this: Genome, ...args: Parameters<Genome["clone"]>) {
    const child = originalClone.apply(this, args);
    return genusOf(child.genes) === genusOf(this.genes) ? child : new Genome(this.genes.slice());
  };
}

// runHeadless does not expose its WorldController before the end: catch its step events
const originalDispatch = EventTarget.prototype.dispatchEvent;
EventTarget.prototype.dispatchEvent = function (event: Event) {
  const result = originalDispatch.call(this, event);
  if (event.type === WorldEvents.endStep) {
    const wc = (event as CustomEvent).detail.worldController as WorldController;
    if (wc.currentGen !== currentGen) {
      finishGeneration(wc);
      tracked = new Map();
      herbivoreSteps = 0;
      moveSteps = 0;
      currentGen = wc.currentGen;
    }
    for (const creature of wc.generations.currentCreatures) {
      if (!creature.isAlive || creature.genus !== "attack_plant") continue;
      const [x, y] = creature.position;
      const t = tracked.get(creature.id);
      if (!t) { tracked.set(creature.id, { creature, x, y, cells: 0 }); continue; }
      herbivoreSteps++;
      if (t.x !== x || t.y !== y) { moveSteps++; t.cells++; t.x = x; t.y = y; }
    }
  }
  return result;
};

function mergeDeep(a: any, b: any): any {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) && typeof a?.[k] === "object" ? mergeDeep(a[k], v) : v;
  }
  return out;
}

(async () => {
  // BASE_SIM=<file.sim>: start from that file (e.g. phase 2, built by forage-phase2-build.ts) with its
  // start genomes, changing only the move costs and the world size
  const baseSim = process.env.BASE_SIM ? JSON.parse(fs.readFileSync(process.env.BASE_SIM, "utf8")) : undefined;
  const { MOVE_COST_PER_MASS_TRY, MOVE_COST_PER_MASS_DO, size } = config.overrides.worldControllerData;
  const result = await runHeadless({
    base: baseSim ?? "startup",
    resume: baseSim !== undefined,
    generations,
    overrides: baseSim
      ? { worldControllerData: { MOVE_COST_PER_MASS_TRY, MOVE_COST_PER_MASS_DO, ...(process.env.WORLD_SIZE ? { size } : {}) } }
      : config.overrides,
    // EXTRA='{"worldControllerData":{...}}': more overrides, merged on top
    ...(process.env.EXTRA ? { overrides: mergeDeep(baseSim
      ? { worldControllerData: { MOVE_COST_PER_MASS_TRY, MOVE_COST_PER_MASS_DO, ...(process.env.WORLD_SIZE ? { size } : {}) } }
      : config.overrides, JSON.parse(process.env.EXTRA)) } : {}),
    seed: Number(seedArg),
    maxRestarts: 3,
    maxSeconds: 3600,
  });
  finishGeneration(result.worldController);
  const outDir = path.join("results", name);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "forage.csv"), rows.join("\n") + "\n");
  fs.writeFileSync(path.join(outDir, "generations.csv"),
    "generation;herbivoresNext;plantsNext;maxMass\n" +
    result.rows.map((r) => [r.generation, r.nextAttackPlants, r.nextPlants, r.maxFitnessValue.toFixed(2)].join(";")).join("\n") + "\n");
  fs.writeFileSync(path.join(outDir, "setup.sim"), JSON.stringify(result.setup, null, 2));
  fs.writeFileSync(path.join(outDir, "final.sim"), JSON.stringify(serializeSimulationData(result.worldController, true)));
  console.log(`${name}: ${result.status}, ${result.rows.length} generations, ${result.seconds.toFixed(0)} s, restarts ${result.restarts}, unknown keys ${result.unknownKeys.join(",") || "none"}`);
  console.log(rows[0]);
  console.log(rows.slice(-3).join("\n"));
})();
