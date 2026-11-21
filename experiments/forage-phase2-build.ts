/*
 * Builds the start file of foraging phase 2: a continuous run seeded with the hunters of phase 1.
 *
 *   npx tsx experiments/forage-phase2-build.ts <phase1 final.sim> <out.sim> <rainMaxPerCell> [hunters (400)]
 *
 * - takes the most common herbivore genome of the phase 1 run;
 * - phase 1 had no Reproduction action: enabling it shifts the actions after it in the enabled list,
 *   so every action gene is renumbered to keep pointing at the same action, and the hunter gets
 *   one more gene, Oscillator -> Reproduction, so that it can reproduce;
 * - plants start with Random -> Photosynthesis and Random -> Reproduction;
 * - the file is a setup with startGenomes: run it with forage-pilot.ts and BASE_SIM=<out.sim>.
 */
import fs from "node:fs";

const [phase1File, outFile, rainArg, huntersArg] = process.argv.slice(2);
const phase1 = JSON.parse(fs.readFileSync(phase1File, "utf8"));
const S: string[] = phase1.worldGenerationsData.enabledSensors;
const A1: string[] = phase1.worldGenerationsData.enabledActions;
const A2 = ["MoveNorth", "MoveSouth", "MoveEast", "MoveWest", "RandomMove", "MoveForward",
  "Photosynthesis", "Reproduction", "AttackPlant", ...(A1.includes("MoveToPrey") ? ["MoveToPrey"] : [])];

const sinkIsAction = (g: number) => ((g >>> 23) & 1) === 1;
const actionOf = (g: number) => A1[((g >>> 16) & 127) % A1.length];
const withSink = (g: number, id: number) => (((g >>> 0) & ~(127 << 16)) | (id << 16)) | 0;
const makeGene = (sensor: string, action: string, weight: number) =>
  ((1 << 31) | (S.indexOf(sensor) << 24) | (1 << 23) | (A2.indexOf(action) << 16) | Math.round((weight + 4) * 8192)) | 0;

const herbivores = (phase1.species as { genes: number[]; creatures: unknown[] }[])
  .filter((p) => p.genes.some((g) => sinkIsAction(g) && actionOf(g) === "AttackPlant"))
  .sort((a, b) => b.creatures.length - a.creatures.length);
const hunter = herbivores[0].genes.map((g) => (sinkIsAction(g) ? withSink(g, A2.indexOf(actionOf(g))) : g));
hunter.push(makeGene("Oscillator", "Reproduction", 2));
const plant = [makeGene("Random", "Photosynthesis", 3), makeGene("Random", "Reproduction", 3)];

const out = { ...phase1 };
delete out.species;
delete out.cellWater;
delete out.stats;
out.worldGenerationsData = {
  ...phase1.worldGenerationsData,
  simulationType: "continuous",
  maxAge: 1000,
  populationStrategy: "AsexualRandomPopulation",
  initialPopulation: 2400,
  enabledActions: A2,
};
out.worldControllerData = { ...phase1.worldControllerData, currentGen: 1, currentStep: 1, seed: undefined, rngState: undefined };
out.waterData = { ...phase1.waterData, waterRainMaxPerCell: Number(rainArg), rainType: "rainTypeSinSin" };
out.startGenomes = [{ genes: hunter, count: Number(huntersArg ?? 400) }, { genes: plant, count: 2000 }];
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
console.log("hunter genes", herbivores[0].creatures.length, "creatures in phase 1:", hunter.length);
