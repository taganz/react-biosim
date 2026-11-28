import fs from "fs";
import path from "path";
import WorldController from "@/simulation/world/WorldController";
import Genome from "@/simulation/creature/brain/Genome";
import { NeuronType } from "@/simulation/creature/brain/Neuron";
import { buildNetworkFromGenes, decodeGene } from "@/simulation/creature/brain/buildNetwork";
import {
  MAX_WEIGHT, addGene, addNeuron, describeGenome, editorContext, encodeGene, freeNeuronId, geneToHex,
  parseGenomeText, removeAction, removeGeneAt, removeNeuron, removeSensor, setGeneWeight,
} from "@/simulation/creature/brain/genomeEditing";
import { applyGenomeEdits, changeGeneLists, editedFileName, listGenomes, parseSimFile, previewGeneLists, stringifySimFile, translateGenes } from "@/simulation/serialization/genomeFile";
import deserializeSimulationData, { serializeSimulationData } from "@/simulation/serialization/formatters/simulationDataSerialization";
import { computeSpeciesId } from "@/simulation/creature/speciesId";
import { setSeed } from "@/simulation/helpers/random";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";

const { SENSOR, ACTION, NEURON } = NeuronType;

describe("buildNetworkFromGenes", () => {
  beforeEach(() => {
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test("builds the same network as a creature", () => {
    setSeed(7);
    const worldController = new WorldController(TEST_SIMULATION_DATA);
    worldController.startRun(TEST_SIMULATION_DATA);
    worldController.pause();
    const context = editorContext(TEST_SIMULATION_DATA.worldGenerationsData);
    for (const creature of worldController.generations.currentCreatures.slice(0, 50)) {
      const built = buildNetworkFromGenes(creature.brain.genome.genes, context.counts, context.staminaId);
      expect(built.network.connections).toEqual(creature.brain.brain.connections);
      expect(built.network.neurons).toEqual(creature.brain.brain.neurons);
      expect(built.staminaGeneIndexes).toEqual(creature.brain.staminaGeneIndexes);
    }
  });

  test("tells the gene of each connection and the number of each neuron", () => {
    const counts = { sensorCount: 3, actionCount: 2, maxNeurons: 5 };
    const genes = [
      encodeGene({ sourceType: SENSOR, sourceId: 1, sinkType: NEURON, sinkId: 4, weight: 1 }),
      encodeGene({ sourceType: SENSOR, sourceId: 0, sinkType: NEURON, sinkId: 2, weight: 1 }), // N2 has no output: pruned
      encodeGene({ sourceType: NEURON, sourceId: 4, sinkType: ACTION, sinkId: 1, weight: -2 }),
    ];
    const built = buildNetworkFromGenes(genes, counts, -1);
    expect(built.neuronGeneIds).toEqual([4]);
    expect(built.connectionGeneIndexes).toEqual([0, 2]);
    expect(built.network.connections[1]).toMatchObject({ sourceType: NEURON, sourceId: 0, sinkId: 1, weight: -2 });
  });
});

describe("genome editing", () => {
  const context = editorContext(TEST_SIMULATION_DATA.worldGenerationsData);
  const sensorToAction = (sourceId: number, sinkId: number, weight = 1) =>
    encodeGene({ sourceType: SENSOR, sourceId, sinkType: ACTION, sinkId, weight });

  test("a gene decodes to the connection it was made from", () => {
    const connection = { sourceType: SENSOR, sourceId: 2, sinkType: NEURON, sinkId: 3, weight: -1.25 };
    expect(decodeGene(encodeGene(connection), context.counts)).toEqual(connection);
  });

  test("weights are kept between -4 and almost 4", () => {
    const gene = sensorToAction(0, 0, 10);
    expect(decodeGene(gene, context.counts).weight).toBe(MAX_WEIGHT);
    expect(decodeGene(setGeneWeight([gene], 0, -9)[0], context.counts).weight).toBe(-4);
    const changed = decodeGene(setGeneWeight([gene], 0, 0.5)[0], context.counts);
    expect(changed).toMatchObject({ sourceId: 0, sinkId: 0, weight: 0.5 });
  });

  test("removes the connections of a sensor, an action or a neuron, but never every gene", () => {
    const genes = [
      sensorToAction(0, 1),
      sensorToAction(1, 1),
      encodeGene({ sourceType: SENSOR, sourceId: 0, sinkType: NEURON, sinkId: 3, weight: 1 }),
      encodeGene({ sourceType: NEURON, sourceId: 3, sinkType: ACTION, sinkId: 0, weight: 1 }),
    ];
    expect(removeSensor(genes, context, 0)).toEqual([genes[1], genes[3]]);
    expect(removeAction(genes, context, 1)).toEqual([genes[2], genes[3]]);
    expect(removeNeuron(genes, context, 3)).toEqual([genes[0], genes[1]]);
    expect(removeGeneAt([genes[0]], context, 0)).toBeNull();
  });

  test("adds a neuron with the lowest free number between a source and a target", () => {
    const genes = [encodeGene({ sourceType: SENSOR, sourceId: 0, sinkType: NEURON, sinkId: 0, weight: 1 })];
    expect(freeNeuronId(genes, context)).toBe(1);
    const result = addNeuron(genes, context, { type: SENSOR, id: 2 }, { type: ACTION, id: 1 }, 2, -1)!;
    expect(result.neuronId).toBe(1);
    const view = describeGenome(result.genes, context);
    expect(view.neuronLabels).toEqual(["N1"]);
    expect(view.rows.map((row) => row.role)).toEqual(["pruned", "connection", "connection"]);
  });

  test("a new connection reaches the network", () => {
    const view = describeGenome(addGene([sensorToAction(0, 0)], { sourceType: SENSOR, sourceId: 1, sinkType: ACTION, sinkId: 1, weight: 3 }), context);
    expect(view.built.network.connections).toHaveLength(2);
  });

  test("reads genomes copied in hexadecimal or as JSON", () => {
    const genes = [sensorToAction(0, 1, -3), sensorToAction(2, 0, 2)];
    const hex = new Genome(genes).toHexadecimalString();
    expect(parseGenomeText(hex)).toEqual(genes);
    expect(genes.map(geneToHex).join(" ")).toBe(hex);
    expect(parseGenomeText(JSON.stringify(genes.map((gene) => gene >>> 0)))).toEqual(genes);
    expect(parseGenomeText(JSON.stringify({ name: "x", genome: genes }))).toEqual(genes);
    expect(() => parseGenomeText("hello")).toThrow();
  });
});

describe("genome file", () => {
  beforeEach(() => {
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test("lists the species of a file and saves the edited genome as a new species", () => {
    const text = fs.readFileSync(path.join(__dirname, "../public/turn right generation 5574.sim"), "utf-8");
    const data = parseSimFile(text);
    const entries = listGenomes(data);
    const species = entries.filter((entry) => entry.source === "species");
    expect(species.length).toBe(data.species!.length);
    expect(species[0].creatures).toBe(data.species![0].creatures.length);

    const context = editorContext(data.worldGenerationsData);
    const edited = setGeneWeight(species[0].genes, 0, 1.5);
    const saved = applyGenomeEdits(data, new Map([[species[0].key, edited]]));
    // the original is not changed
    expect(data.species![0].genes).toEqual(species[0].genes);
    expect(saved.species![0].genes).toEqual(edited);
    // a file without species ids: the parent is the root id the app gives the old genes
    expect(saved.species![0].parentId).toBe(data.species![0].id ?? computeSpeciesId(data.species![0].genes, null));
    expect(saved.species![0].id).not.toBe(data.species![0].id);
    expect(saved.species![1]).toEqual(data.species![1]);
    expect(decodeGene(saved.species![0].genes[0], context.counts).weight).toBe(1.5);

    // the app loads it
    const reloaded = parseSimFile(stringifySimFile(saved));
    const worldController = new WorldController(TEST_SIMULATION_DATA);
    const simulationData = deserializeSimulationData(worldController, reloaded);
    expect(simulationData.species![0].genome.genes).toEqual(edited);
  });

  test("edits the start genomes and the species of generation 1", () => {
    const worldController = new WorldController(TEST_SIMULATION_DATA);
    worldController.startRun(TEST_SIMULATION_DATA);
    worldController.pause();
    const data = serializeSimulationData(worldController, false);
    data.species = undefined;
    data.startGenomes = [{ genes: [1, 2], count: 3 }];
    data.constants = { ...data.constants, POPULATION_DEFAULT_SPECIES: [{ name: "a", genome: [5] }] };
    const keys = listGenomes(data).map((entry) => entry.key);
    expect(keys).toEqual(["startGenome:0", "defaultSpecies:0", ...(data.worldGenerationsData.plantGenes.length ? ["plantGenes:0"] : [])]);
    const saved = applyGenomeEdits(data, new Map([["startGenome:0", [7]], ["defaultSpecies:0", [8, 9]]]));
    expect(saved.startGenomes![0]).toEqual({ genes: [7], count: 3 });
    expect(saved.constants.POPULATION_DEFAULT_SPECIES[0]).toEqual({ name: "a", genome: [8, 9] });
    expect(() => applyGenomeEdits(data, new Map([["startGenome:0", []]]))).toThrow();
  });

  test("other enabled sensors and actions keep the brains, except for what is removed", () => {
    const text = fs.readFileSync(path.join(__dirname, "../public/turn right generation 5574.sim"), "utf-8");
    const data = parseSimFile(text);
    const lists = data.worldGenerationsData;
    const before = editorContext(lists);
    // a sensor used by some species is disabled, and another one (earlier in the table) is enabled
    const usedSensor = before.sensors.enabledSensors[decodeGene(data.species![0].genes.find((gene) =>
      decodeGene(gene, before.counts).sourceType === SENSOR)!, before.counts).sourceId];
    const allSensors = Object.keys(before.sensors.data) as typeof lists.enabledSensors;
    const added = allSensors.find((name) => !lists.enabledSensors.includes(name))!;
    const newLists = {
      enabledSensors: [added, ...lists.enabledSensors.filter((name) => name !== usedSensor)],
      enabledActions: lists.enabledActions,
      maxNumberNeurons: lists.maxNumberNeurons + 5,
    };
    const change = changeGeneLists(data, newLists);
    const after = editorContext(change.data.worldGenerationsData);
    expect(change.data.worldGenerationsData.enabledSensors).toContain(added);
    expect(change.data.worldGenerationsData.enabledSensors).not.toContain(usedSensor);
    expect(change.removed).toBeGreaterThan(0);
    expect(previewGeneLists(data.species!.map((species) => species.genes), lists, newLists))
      .toEqual({ removed: change.removed, folded: change.folded, changedGenomes: change.changedGenomes });
    expect(translateGenes(data.species![0].genes, lists, newLists)).toEqual(change.data.species![0].genes);

    // the connections that stay point to the same sensors, actions and weights
    const named = (genes: number[], context: typeof before) => genes.map((gene) => decodeGene(gene, context.counts))
      .filter((c) => !(c.sourceType === SENSOR && context.sensors.enabledSensors[c.sourceId] === usedSensor))
      .map((c) => [c.sourceType === SENSOR ? context.sensors.enabledSensors[c.sourceId] : c.sourceId,
        c.sinkType === ACTION ? context.actions.enabledActions[c.sinkId] : c.sinkId, c.weight]);
    data.species!.forEach((species, index) => {
      const genes = change.data.species![index].genes;
      if (named(species.genes, before).length > 0) expect(named(genes, after)).toEqual(named(species.genes, before));
      // species keep their ids
      expect(change.data.species![index].id).toBe(species.id);
    });
    expect(() => changeGeneLists(data, { ...newLists, enabledActions: [] })).toThrow();
  });

  test("names the edited file", () => {
    expect(editedFileName("sim Q63 generation 98438.sim")).toBe("sim Q63 generation 98438 edited.sim");
  });
});
