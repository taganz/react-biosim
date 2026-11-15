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

const ACTIONS: ActionName[] = [
  "MoveNorth", "MoveSouth", "MoveEast", "MoveWest", "RandomMove", "MoveForward",
  "Photosynthesis", "Reproduction", "AttackPlant", "AttackAnimal",
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
    const creature = world.generations.newCreature([1, 1], true, new Genome([geneTo(world, "MoveEast", 1)]));
    expect(creature.brain.stamina).toBe(0.8);
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

  test("in the steps it does not think, only the primary genes cost basal consumption", () => {
    const world = makeWorld(true, true);
    const genes = [geneTo(world, "Reproduction", 1), geneTo(world, "MoveEast", 1), geneTo(world, "Stamina", 0)];
    const creature = world.generations.newCreature([1, 1], true, new Genome(genes));
    const mass = creature._mass;
    const parts = CreatureMass.basalConsumptionParts(world.generations, genes, creature.genus);
    expect(parts.primary).toBeCloseTo(0.01);
    expect(parts.brain).toBeCloseTo(0.08);   // the Stamina gene costs like any other gene
    expect(mass._basalConsumption).toBe(CreatureMass.basalConsumption(world.generations, genes, creature.genus));

    const start = mass.mass;
    mass.basalMetabolism(false);
    expect(start - mass.mass).toBeCloseTo(0.01);
    mass.basalMetabolism(true);
    expect(start - mass.mass).toBeCloseTo(0.10);
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
