import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureBrain from "@/simulation/creature/brain/CreatureBrain";
import CreatureMass from "@/simulation/creature/CreatureMass";
import { NeuronType } from "@/simulation/creature/brain/Neuron";
import { ActionName } from "@/simulation/creature/brain/CreatureActions";
import { getRandomState } from "@/simulation/helpers/random";
import serializeSpecies from "@/simulation/serialization/formatters/speciesSerialization";
import Creature from "@/simulation/creature/Creature";
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";

const ACTIONS: ActionName[] = [
  "MoveNorth", "MoveSouth", "MoveEast", "MoveWest", "RandomMove", "MoveForward",
  "Photosynthesis", "Reproduction", "Attack",
];

function makeWorld(staminaEnabled: boolean, metabolismEnabled = false): WorldController {
  const simulationData: SimulationData = {
    ...TEST_SIMULATION_DATA,
    worldObjects: [],
    worldControllerData: {
      ...TEST_SIMULATION_DATA.worldControllerData,
      size: 10,
      STAMINA_DEFAULT: 0.8,
      STAMINA_MIN: 0.1,
      MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY: 0.01,
      MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE: 0.04,
    },
    worldGenerationsData: {
      ...TEST_SIMULATION_DATA.worldGenerationsData,
      enabledActions: staminaEnabled ? [...ACTIONS, "Stamina"] : [...ACTIONS],
      metabolismEnabled,
      initialPopulation: 0,
    },
  };
  return new WorldController(simulationData);
}

// a gene from the first enabled sensor to an action, with this weight
function geneTo(world: WorldController, action: ActionName, weight: number): number {
  return Genome.connectionToGene({
    sourceType: NeuronType.SENSOR, sourceId: 0,
    sinkType: NeuronType.ACTION, sinkId: world.generations.actions.actionNameToId(action), weight,
  });
}

describe("stamina", () => {
  test("staminaFromWeight maps -4..4 to 0..1, between STAMINA_MIN and 1, and uses STAMINA_DEFAULT without a gene", () => {
    const data = { STAMINA_DEFAULT: 0.8, STAMINA_MIN: 0.1 };
    expect(CreatureBrain.staminaFromWeight(0, data)).toBe(0.5);
    expect(CreatureBrain.staminaFromWeight(-2, data)).toBe(0.25);
    expect(CreatureBrain.staminaFromWeight(-4, data)).toBe(0.1);
    expect(CreatureBrain.staminaFromWeight(4, data)).toBe(1);
    expect(CreatureBrain.staminaFromWeight(null, data)).toBe(0.8);
    expect(CreatureBrain.staminaFromWeight(null, { STAMINA_DEFAULT: 3, STAMINA_MIN: 0 })).toBe(1);
    // files saved without the settings
    expect(CreatureBrain.staminaFromWeight(null, {})).toBe(1);
    expect(CreatureBrain.staminaFromWeight(-4, {})).toBe(0.05);
    // never 0, or the brain would never run
    expect(CreatureBrain.staminaFromWeight(-4, { STAMINA_DEFAULT: 1, STAMINA_MIN: 0 })).toBeGreaterThan(0);
  });

  test("without the Stamina action every brain has stamina 1 and creating a creature draws no number", () => {
    const world = makeWorld(false);
    const before = getRandomState();
    const creature = world.generations.newCreature([1, 1], true, new Genome([geneTo(world, "MoveEast", 1)]));
    expect(creature.brain.stamina).toBe(1);
    expect(getRandomState()).toBe(before);
  });

  test("the first Stamina gene gives the stamina, and Stamina genes are not connections of the network", () => {
    const world = makeWorld(true);
    const genes = [geneTo(world, "MoveEast", 1), geneTo(world, "Stamina", -2), geneTo(world, "Stamina", 2)];
    const creature = world.generations.newCreature([1, 1], true, new Genome(genes));
    expect(creature.brain.stamina).toBe(0.25);
    expect(creature.brain.staminaGeneIndexes).toEqual([1, 2]);
    expect(creature.brain.brain.connections.length).toBe(1);
    const staminaId = world.generations.actions.actionNameToId("Stamina");
    expect(creature.brain.brain.connections.some((c) => c.sinkType === NeuronType.ACTION && c.sinkId === staminaId)).toBe(false);
  });

  test("a genome without a Stamina gene takes STAMINA_DEFAULT", () => {
    const world = makeWorld(true);
    // as a creature of an older file is restored, without newCreature
    const creature = new Creature(world.generations, [1, 1], false, new Genome([geneTo(world, "MoveEast", 1)]));
    expect(creature.brain.stamina).toBe(0.8);
  });

  test("newCreature gives every genome without one a Stamina gene with a random stamina", () => {
    const world = makeWorld(true);
    const generations = world.generations;
    const rules = generations.staminaGeneRules()!;
    const given = generations.newCreature([1, 1], true, new Genome([geneTo(world, "MoveEast", 1)]));
    const random = generations.newCreature([2, 2], true);
    const child = generations.newCreature([3, 3], false, new Genome([geneTo(world, "MoveEast", 1)]));
    for (const creature of [given, random, child]) {
      expect(creature.brain.genome.genes.filter(rules.isStaminaGene).length).toBe(1);
    }
    expect(given.brain.genome.genes.length).toBe(2);
    expect(random.brain.genome.genes.length).toBe(generations.initialGenomeSize + 1);
    // the genomes made by genus get no Stamina gene among their random genes either
    expect(generations.actions.enabledActionsForGenus("plant")).not.toContain("Stamina");
    for (let i = 0; i < 50; i++) {
      const genes = CreatureGenus.geneArrayForGenus(generations, "plant", 6);
      expect(genes.some(rules.isStaminaGene)).toBe(false);
      const random = generations.newCreature([i % 10, 5], true);
      expect(random.brain.genome.genes.filter(rules.isStaminaGene).length).toBe(1);
    }
    // uniform between 0 and 1
    const values = Array.from({ length: 400 }, (_, i) =>
      generations.newCreature([i % 10, Math.floor(i / 10) % 10], true, new Genome([geneTo(world, "MoveEast", 1)])).brain.stamina);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.6);
    expect(Math.max(...values)).toBeGreaterThan(0.9);
    // and a genome that has one keeps it as it is
    const kept = generations.newCreature([4, 4], true, new Genome([geneTo(world, "Stamina", 0)]));
    expect(kept.brain.genome.genes.length).toBe(1);
    expect(kept.brain.stamina).toBe(0.5);
  });

  test("without the Stamina action there are no stamina rules and genomes are not changed", () => {
    const world = makeWorld(false);
    expect(world.generations.staminaGeneRules()).toBeUndefined();
    const creature = world.generations.newCreature([1, 1], true, new Genome([geneTo(world, "MoveEast", 1)]));
    expect(creature.brain.genome.genes.length).toBe(1);
  });

  test("cloning never deletes the Stamina gene and keeps at least one other gene", () => {
    const world = makeWorld(true);
    const rules = world.generations.staminaGeneRules()!;
    const genes = [geneTo(world, "Stamina", 0), geneTo(world, "MoveEast", 1), geneTo(world, "MoveWest", 1)];
    let genome = new Genome(genes);
    for (let i = 0; i < 20; i++) {
      genome = genome.clone(true, MutationMode.wholeGene, 20, 0, 1, 1, rules);   // always a deletion
    }
    expect(genome.genes.length).toBe(2);
    expect(genome.genes.filter(rules.isStaminaGene)).toEqual([genes[0]]);
  });

  test.each([MutationMode.wholeGene, MutationMode.singleBit, MutationMode.singleHexDigit])(
    "with mutation mode %s the Stamina gene only moves its weight a small step and no other gene becomes one", (mode) => {
    const world = makeWorld(true);
    const rules = world.generations.staminaGeneRules()!;
    const staminaOf = (genome: Genome) => {
      const gene = genome.genes.find(rules.isStaminaGene)!;
      return ((gene & 65535) / 8192) / 8;
    };
    let genome = new Genome([geneTo(world, "Stamina", 0), geneTo(world, "MoveEast", 1)]);
    for (let i = 0; i < 500; i++) {
      const before = staminaOf(genome);
      // a mutation every time, and insertions up to 6 genes
      genome = genome.clone(true, mode, 6, 1, 0.5, 0, rules);
      expect(genome.genes.filter(rules.isStaminaGene).length).toBe(1);
      expect(Math.abs(staminaOf(genome) - before)).toBeLessThanOrEqual(0.05 + 1e-4);
    }
    // the stamina did move
    expect(staminaOf(genome)).not.toBe(0.5);
  });

  test("the brain runs in a share of the steps equal to the stamina", () => {
    const world = makeWorld(true);
    const genes = [geneTo(world, "MoveEast", 1), geneTo(world, "Stamina", -2)];   // stamina 0.25
    const creature = world.generations.newCreature([1, 1], true, new Genome(genes));
    const step = jest.spyOn(creature.brain, "step");
    for (let i = 0; i < 100; i++) creature.computeStep();
    expect(step).toHaveBeenCalledTimes(25);
    expect(creature.thinkCount).toBe(25);
  });

  test("in the steps it does not think, the creature keeps the urge to move of its last thought", () => {
    const world = makeWorld(true);
    const genes = [geneTo(world, "MoveEast", 1), geneTo(world, "Stamina", 0)];   // stamina 0.5
    const creature = world.generations.newCreature([1, 1], true, new Genome(genes));
    creature.thinkCharge = 0;
    const step = jest.spyOn(creature.brain, "step").mockImplementation(() => creature.addUrgeToMove(0.7, 0));

    creature.computeStep();   // charge 0.5: does not think
    expect(step).not.toHaveBeenCalled();
    expect(creature.urgeToMove).toEqual([0, 0]);

    creature.computeStep();   // charge 1: thinks
    expect(step).toHaveBeenCalledTimes(1);
    expect(creature.urgeToMove).toEqual([0.7, 0]);

    creature.computeStep();   // does not think: the urge stays, it is not added again
    expect(step).toHaveBeenCalledTimes(1);
    expect(creature.urgeToMove).toEqual([0.7, 0]);

    creature.computeStep();   // thinks: the urge starts from 0
    expect(creature.urgeToMove).toEqual([0.7, 0]);
  });

  test("the genes cost every step, the sensors and actions of the brain only in the steps it thinks", () => {
    const world = makeWorld(true, true);
    const data = world.simData.worldControllerData;
    data.SENSOR_COSTS = { HorizontalPosition: 0.002, VerticalPosition: 0.02 };
    data.ACTION_COSTS = { Reproduction: 0.003, MoveEast: 0.03 };
    const fromSensor = (sensor: number, action: ActionName) => Genome.connectionToGene({
      sourceType: NeuronType.SENSOR, sourceId: sensor,
      sinkType: NeuronType.ACTION, sinkId: world.generations.actions.actionNameToId(action), weight: 1,
    });
    // sensors 0 (HorizontalPosition) and 1 (VerticalPosition); Reproduction twice, MoveEast
    const genes = [fromSensor(0, "Reproduction"), fromSensor(1, "Reproduction"), fromSensor(1, "MoveEast"), geneTo(world, "Stamina", 0)];
    const creature = world.generations.newCreature([1, 1], true, new Genome(genes));
    // each sensor and action once: 0.002 + 0.02 + 0.003 + 0.03; the Stamina gene is neither
    expect(creature.brain.thinkCost).toBeCloseTo(0.055);
    const mass = creature._mass;
    // primary 0.01 + two genes 0.04 each; the Stamina gene costs nothing
    expect(mass._basalConsumption).toBeCloseTo(0.09);
    expect(mass._thinkCost).toBeCloseTo(0.055);

    const start = mass.mass;
    mass.basalMetabolism(false);
    expect(start - mass.mass).toBeCloseTo(0.09);
    mass.basalMetabolism(true);
    expect(start - mass.mass).toBeCloseTo(0.09 + 0.145);
  });

  test("files saved without the thinking costs spend nothing for thinking", () => {
    const world = makeWorld(true, true);
    const data = world.simData.worldControllerData;
    delete data.SENSOR_COSTS;
    delete data.ACTION_COSTS;
    const creature = world.generations.newCreature([1, 1], true, new Genome([geneTo(world, "Reproduction", 1)]));
    expect(creature.brain.thinkCost).toBe(0);
    expect(creature._mass._basalConsumption).toBeCloseTo(0.01);
  });

  test("a save keeps the think charge and the urge to move of creatures with stamina below 1", () => {
    const world = makeWorld(true);
    const genes = [geneTo(world, "MoveEast", 1), geneTo(world, "Stamina", 0)];
    const creature = world.generations.newCreature([1, 1], true, new Genome(genes));
    world.generations.currentCreatures = [creature];
    creature.thinkCharge = 0.3;
    creature.urgeToMove = [0.2, -0.4];
    const saved = serializeSpecies(world)[0].creatures[0];
    expect(saved.thinkCharge).toBe(0.3);
    expect(saved.urgeToMove).toEqual([0.2, -0.4]);
  });
});
