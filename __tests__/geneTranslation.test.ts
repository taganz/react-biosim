import Genome, { Gene } from "@/simulation/creature/brain/Genome";
import { NeuronType } from "@/simulation/creature/brain/Neuron";
import Creature from "@/simulation/creature/Creature";
import {
  countChangedBrains, decodingFromData, GeneDecoding, translateGene, translateGenome,
} from "@/simulation/creature/brain/geneTranslation";
import WorldController from "@/simulation/world/WorldController";
import worldControllerSimDataHotChange from "@/simulation/world/worldControllerSimDataHotChange";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import { SensorName } from "@/simulation/creature/brain/CreatureSensors";
import { ActionName } from "@/simulation/creature/brain/CreatureActions";

/* "Update simulation" rewrites the genes so that new sensors, actions or neurons keep the brains */

const gene = (sourceType: NeuronType, sourceId: number, sinkType: NeuronType, sinkId: number, weight = 1): Gene =>
  Genome.connectionToGene({ sourceType, sourceId, sinkType, sinkId, weight });

// what a gene connects with a decoding, by name
function connectionOf(g: Gene, d: GeneDecoding): string {
  const sourceId = (g >> 24) & 127;
  const sinkId = (g >> 16) & 127;
  const source = ((g >> 31) & 1) === NeuronType.SENSOR ? d.sensors[sourceId % d.sensors.length] : `N${sourceId % d.maxNeurons}`;
  const sink = ((g >> 23) & 1) === NeuronType.ACTION ? d.actions[sinkId % d.actions.length] : `N${sinkId % d.maxNeurons}`;
  return `${source}->${sink}:${g & 65535}`;
}

const from: GeneDecoding = decodingFromData({
  enabledSensors: ["HorizontalPosition", "VerticalPosition", "Oscillator"],
  enabledActions: ["MoveNorth", "MoveEast"],
  maxNumberNeurons: 2,
});

describe("translateGene", () => {
  test("keeps sensor, action and neuron when one is enabled in the middle and neurons grow", () => {
    const to = decodingFromData({
      enabledSensors: ["HorizontalPosition", "VerticalPosition", "Age", "Oscillator"],
      enabledActions: ["MoveNorth", "MoveSouth", "MoveEast"],
      maxNumberNeurons: 5,
    });
    for (let i = 0; i < 2000; i++) {
      const g = Genome.generateRandomGene();
      const translated = translateGene(g, from, to);
      if (translated === "removed") throw new Error("nothing was disabled");
      expect(translated.folded).toBe(false);
      expect(connectionOf(translated.gene, to)).toBe(connectionOf(g, from));
    }
  });

  test("leaves a gene unchanged when it already decodes the same way", () => {
    // sensor 4 % 3 = Oscillator; in a list of 4 Oscillator is at 3, and 7 % 4 = 3
    const to = decodingFromData({
      enabledSensors: ["HorizontalPosition", "VerticalPosition", "Age", "Oscillator"],
      enabledActions: ["MoveNorth", "MoveEast"],
      maxNumberNeurons: 2,
    });
    const g = gene(NeuronType.SENSOR, 5, NeuronType.ACTION, 1);   // 5 % 3 = 2 Oscillator; 5 % 4 = 1: changes
    const h = gene(NeuronType.SENSOR, 0, NeuronType.ACTION, 1);   // HorizontalPosition stays at 0
    expect(translateGene(h, from, to)).toEqual({ gene: h, folded: false });
    const translated = translateGene(g, from, to);
    expect(translated).not.toBe("removed");
    if (translated !== "removed") expect(connectionOf(translated.gene, to)).toBe(connectionOf(g, from));
  });

  test("keeps the unsigned form of a gene", () => {
    const to = { ...from, maxNeurons: 3 };
    // the top bit is set for a sensor source: HorizontalPosition -> N1 (3 % 2), unsigned
    const g = gene(NeuronType.SENSOR, 0, NeuronType.NEURON, 3) >>> 0;
    expect(g).toBeGreaterThan(0x7fffffff);
    const translated = translateGene(g, from, to);
    if (translated === "removed") throw new Error("not removed");
    expect(translated.gene).toBeGreaterThan(0x7fffffff);
    expect(connectionOf(translated.gene, to)).toBe(connectionOf(g, from));
  });

  test("a disabled sensor or action removes the gene", () => {
    const to = decodingFromData({ enabledSensors: ["HorizontalPosition", "Oscillator"], enabledActions: ["MoveNorth"], maxNumberNeurons: 2 });
    expect(translateGene(gene(NeuronType.SENSOR, 1, NeuronType.NEURON, 0), from, to)).toBe("removed");   // VerticalPosition
    expect(translateGene(gene(NeuronType.NEURON, 0, NeuronType.ACTION, 1), from, to)).toBe("removed");   // MoveEast
    const kept = translateGene(gene(NeuronType.SENSOR, 2, NeuronType.ACTION, 0), from, to);          // Oscillator -> MoveNorth
    if (kept === "removed") throw new Error("not removed");
    expect(connectionOf(kept.gene, to)).toBe("Oscillator->MoveNorth:" + (gene(NeuronType.SENSOR, 2, NeuronType.ACTION, 0) & 65535));
  });

  test("fewer neurons fold the ones that no longer exist", () => {
    const fromFour = { ...from, maxNeurons: 4 };
    const to = { ...from, maxNeurons: 2 };
    const low = translateGene(gene(NeuronType.NEURON, 1, NeuronType.ACTION, 0), fromFour, to);
    const high = translateGene(gene(NeuronType.NEURON, 3, NeuronType.ACTION, 0), fromFour, to);
    expect(low).toMatchObject({ folded: false });
    expect(high).toMatchObject({ folded: true });
  });
});

describe("translateGenome", () => {
  test("deletes the removed genes, but never empties the genome", () => {
    const to = decodingFromData({ enabledSensors: ["HorizontalPosition"], enabledActions: ["MoveNorth"], maxNumberNeurons: 2 });
    const usesMoveEast = gene(NeuronType.NEURON, 0, NeuronType.ACTION, 1);
    const kept = gene(NeuronType.SENSOR, 0, NeuronType.ACTION, 0);
    expect(translateGenome([usesMoveEast, kept], from, to)).toEqual({ genes: [kept], removed: 1, folded: 0 });
    expect(translateGenome([usesMoveEast], from, to)).toEqual({ genes: [usesMoveEast], removed: 0, folded: 0 });
  });

  test("countChangedBrains counts the genomes that lose or fold a gene", () => {
    const to = { ...from, maxNeurons: 1 };
    const genomes = [
      [gene(NeuronType.SENSOR, 0, NeuronType.ACTION, 0)],
      [gene(NeuronType.SENSOR, 0, NeuronType.NEURON, 1)],   // N1 no longer exists
    ];
    expect(countChangedBrains(genomes, from, to)).toBe(1);
    expect(countChangedBrains(genomes, from, from)).toBe(0);
  });
});

describe("Update simulation with other sensors, actions and neurons", () => {
  let simulationData: SimulationData;
  let worldController: WorldController;

  // each brain, by sensor, action and neuron names, in the decoding of its own generations
  const brainOf = (creature: Creature) => {
    const { sensors, actions } = creature.generations;
    return creature.brain.brain.connections.map((c) =>
      `${c.sourceType === NeuronType.SENSOR ? sensors.enabledSensors[c.sourceId] : "N" + c.sourceId}` +
      `->${c.sinkType === NeuronType.ACTION ? actions.enabledActions[c.sinkId] : "N" + c.sinkId}:${c.weight}`).join(" ");
  };
  const brains = (wc: WorldController) =>
    new Map(wc.generations.currentCreatures.map((c) => [c.id, brainOf(c)]));

  beforeEach(() => {
    jest.useFakeTimers();
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
    const sensors: SensorName[] = ["HorizontalPosition", "VerticalPosition", "Oscillator", "BorderDistance"];
    const actions: ActionName[] = ["MoveNorth", "MoveEast", "MoveForward"];
    simulationData = {
      ...startUpScenarioSimulationData,
      worldObjects: [],
      worldControllerData: { ...startUpScenarioSimulationData.worldControllerData, size: 30, stepsPerGen: 1000 },
      worldGenerationsData: {
        ...startUpScenarioSimulationData.worldGenerationsData,
        initialPopulation: 40, initialGenomeSize: 12, maxNumberNeurons: 3, enabledSensors: sensors, enabledActions: actions,
      },
    };
    worldController = new WorldController(simulationData);
    worldController.startRun(simulationData);
    worldController.pause();
  });

  afterEach(() => {
    worldController.pause();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("enabling sensors and actions in the middle and raising Max neurons keeps every brain", () => {
    const before = brains(worldController);
    const draft = {
      ...simulationData,
      worldGenerationsData: {
        ...simulationData.worldGenerationsData,
        maxNumberNeurons: 7,
        enabledSensors: [...simulationData.worldGenerationsData.enabledSensors, "Age", "TouchNorth"] as SensorName[],
        enabledActions: [...simulationData.worldGenerationsData.enabledActions, "MoveSouth", "RandomMove"] as ActionName[],
      },
    };
    worldControllerSimDataHotChange(worldController, draft);
    worldController.pause();

    expect(worldController.generations.maxNumberNeurons).toBe(7);
    expect(brains(worldController)).toEqual(before);
    // the start genomes are translated too: a child of a start genome gets the same brain
    expect(worldController.generations.startGenomes).toHaveLength(40);
  });

  test("disabling a sensor removes only the genes that use it", () => {
    const before = brains(worldController);
    const draft = {
      ...simulationData,
      worldGenerationsData: { ...simulationData.worldGenerationsData, enabledSensors: ["HorizontalPosition", "Oscillator", "BorderDistance"] as SensorName[] },
    };
    worldControllerSimDataHotChange(worldController, draft);
    worldController.pause();

    for (const [id, brain] of brains(worldController)) {
      const old = before.get(id)!;
      if (!old.includes("VerticalPosition")) expect(brain).toBe(old);
      expect(brain).not.toContain("VerticalPosition");
    }
  });
});
