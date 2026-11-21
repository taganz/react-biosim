/*
 * Photosynthesis balance: at what cost does a Photosynthesis gene stop paying for a herbivore?
 *
 *   npx tsx experiments/photo-balance.ts <name> <seed> '<worldControllerData overrides as JSON>' [generations]
 *
 * Runs experiments/forage-pilot.json (Plant/Herbivore + Greatest Mass) with the overrides given, and with
 * Photosynthesis open to every genus (unlike forage-pilot.ts). Writes results/<name>/balance.csv, one row per generation:
 *   herbivores      herbivores tracked in the generation
 *   photoGenes      share of herbivores whose genome drives Photosynthesis
 *   massPhoto / massNoPhoto   mean final mass of the living herbivores with / without that gene
 *   killsPhoto / killsNoPhoto mean plants eaten by each group
 *   gainPhotoHerb   mean water from photosynthesis per step alive, herbivores with the gene
 *   gainPlant       the same for plants
 *   plantsAlive     share of plants alive at the last step
 *   plantMass       mean mass of the living plants at the last step
 */
import fs from "node:fs";
import path from "node:path";
import { runHeadless } from "@/simulation/headless/runHeadless";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureClass from "@/simulation/creature/Creature";
type Creature = CreatureClass;
import type WorldController from "@/simulation/world/WorldController";

const [name, seedArg, overridesArg, gensArg] = process.argv.slice(2);
if (!name || !seedArg || !overridesArg) {
  console.error("Usage: npx tsx experiments/photo-balance.ts <name> <seed> '<json overrides>' [generations]");
  process.exit(1);
}
const generations = Number(gensArg ?? 300);
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "forage-pilot.json"), "utf8"));
Object.assign(config.overrides.worldControllerData, JSON.parse(overridesArg));

function hasPhotoGene(wc: WorldController, creature: Creature) {
  const gens = wc.generations;
  const A = gens.actions.enabledActions.map(String);
  return creature.brain.genome.genes.some((g) => {
    const c = Genome.geneToConnection(g, gens);
    return c.sinkType === 1 && A[c.sinkId] === "Photosynthesis";
  });
}

type Tracked = { creature: Creature; steps: number; photo: boolean };
let tracked = new Map<number, Tracked>();
let currentGen = -1;
const rows: string[] = ["generation;herbivores;photoGenes;massPhoto;massNoPhoto;killsPhoto;killsNoPhoto;gainPhotoHerb;gainPlant;plantsAlive;plantMass"];

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const f = (x: number, d = 3) => (Number.isNaN(x) ? "" : x.toFixed(d));

function finishGeneration() {
  const all = [...tracked.values()];
  if (all.length === 0) return;
  const herb = all.filter((t) => t.creature.genus === "attack_plant");
  const plants = all.filter((t) => t.creature.genus === "plant");
  const group = (photo: boolean) => herb.filter((t) => t.photo === photo);
  const massAlive = (g: Tracked[]) => mean(g.filter((t) => t.creature.isAlive).map((t) => t.creature.mass));
  const kills = (g: Tracked[]) => mean(g.map((t) => t.creature.killCount));
  const gain = (g: Tracked[]) => mean(g.filter((t) => t.steps > 0).map((t) => t.creature.waterFromPhotosynthesis / t.steps));
  const P = group(true), N = group(false);
  rows.push([
    currentGen, herb.length, f(P.length / Math.max(1, herb.length)),
    f(massAlive(P), 2), f(massAlive(N), 2), f(kills(P), 2), f(kills(N), 2),
    f(gain(P), 4), f(gain(plants), 4),
    f(plants.filter((t) => t.creature.isAlive).length / Math.max(1, plants.length)),
    f(massAlive(plants), 2),
  ].join(";"));
}

// runHeadless does not expose its WorldController before the end: catch its step events
const originalDispatch = EventTarget.prototype.dispatchEvent;
EventTarget.prototype.dispatchEvent = function (event: Event) {
  const result = originalDispatch.call(this, event);
  if (event.type === WorldEvents.endStep) {
    const wc = (event as CustomEvent).detail.worldController as WorldController;
    if (wc.currentGen !== currentGen) {
      finishGeneration();
      tracked = new Map();
      currentGen = wc.currentGen;
    }
    for (const creature of wc.generations.currentCreatures) {
      const t = tracked.get(creature.id);
      if (!t) {
        tracked.set(creature.id, { creature, steps: 1, photo: creature.genus === "attack_plant" && hasPhotoGene(wc, creature) });
      } else if (creature.isAlive) {
        t.steps++;
      }
    }
  }
  return result;
};

(async () => {
  const result = await runHeadless({
    base: "startup",
    generations,
    overrides: config.overrides,
    seed: Number(seedArg),
    maxRestarts: 3,
    maxSeconds: 3600,
  });
  finishGeneration();
  const outDir = path.join("results", name);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "balance.csv"), rows.join("\n") + "\n");
  fs.writeFileSync(path.join(outDir, "setup.sim"), JSON.stringify(result.setup, null, 2));
  console.log(`${name}: ${result.status}, ${result.rows.length} generations, ${result.seconds.toFixed(0)} s, restarts ${result.restarts}, unknown keys ${result.unknownKeys.join(",") || "none"}`);
  console.log(rows[0]);
  console.log(rows.slice(-3).join("\n"));
})();
