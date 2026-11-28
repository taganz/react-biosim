import { Gene } from "./Genome";
import { ConnectionType } from "./Connection";
import { NeuronType } from "./Neuron";
import CreatureSensors, { SensorName } from "./CreatureSensors";
import CreatureActions, { ActionName } from "./CreatureActions";
import { BuiltNetwork, GeneCounts, buildNetworkFromGenes, decodeGene } from "./buildNetwork";
import { networkLabelsFromLists } from "./Helpers/networkLabels";
import type { Genus } from "../CreatureGenus";

/*
Helpers of the brain editor (app/brain-editor): they read and change genomes gene by gene.
A gene is one connection; the editor shows its ids as the engine decodes them (modulo the
number of enabled sensors, enabled actions or Max neurons) and writes them back in that form.
Genomes are never left empty: a creature needs at least one gene.
*/

/** weights a gene can hold: 16 bits from -4 to 4 - 1/8192 */
export const MIN_WEIGHT = -4;
export const MAX_WEIGHT = 4 - 1 / 8192;

/** what a genome is decoded with: the enabled lists of the file and Max neurons */
export type EditorContext = {
  sensors: CreatureSensors;
  actions: CreatureActions;
  counts: GeneCounts;
  /** enabled id of the Stamina action, -1 when it is not enabled */
  staminaId: number;
  sensorLabels: string[];
  actionLabels: string[];
};

export function editorContext(data: {
  enabledSensors: SensorName[];
  enabledActions: ActionName[];
  maxNumberNeurons: number;
}): EditorContext {
  // the lists in table order, as WorldGenerations builds them
  const sensors = new CreatureSensors();
  sensors.loadFromList(data.enabledSensors);
  const actions = new CreatureActions(0);
  actions.loadFromList(data.enabledActions);
  const labels = networkLabelsFromLists(sensors, actions);
  return {
    sensors,
    actions,
    counts: { sensorCount: sensors.neuronsCount, actionCount: actions.neuronsCount, maxNeurons: data.maxNumberNeurons },
    staminaId: actions.data.Stamina.enabled ? actions.actionNameToId("Stamina") : -1,
    sensorLabels: labels.sensors,
    actionLabels: labels.actions,
  };
}

/**
 * What a gene does in the brain:
 * - connection: it is a connection of the network;
 * - pruned: the engine deletes it when it builds the brain (its neuron has no way to an action);
 * - stamina: it drives the Stamina action, which is not a connection. Only the first one counts.
 */
export type GeneRole = "connection" | "pruned" | "stamina";

export type GeneRow = {
  index: number;
  gene: Gene;
  connection: ConnectionType;
  role: GeneRole;
};

export type GenomeView = {
  rows: GeneRow[];
  built: BuiltNetwork;
  /** label of each network neuron in the diagram, with its number in the genes */
  neuronLabels: string[];
  genus: Genus;
};

export function describeGenome(genes: readonly Gene[], context: EditorContext): GenomeView {
  const built = buildNetworkFromGenes(genes, context.counts, context.staminaId);
  const kept = new Set(built.connectionGeneIndexes);
  const stamina = new Set(built.staminaGeneIndexes);
  const rows = genes.map((gene, index) => ({
    index,
    gene,
    connection: decodeGene(gene, context.counts),
    role: (stamina.has(index) ? "stamina" : kept.has(index) ? "connection" : "pruned") as GeneRole,
  }));
  return {
    rows,
    built,
    neuronLabels: built.neuronGeneIds.map((id) => `N${id}`),
    genus: genusOf(built, context),
  };
}

// as CreatureGenus.getGenus: an Attack connection makes an animal, otherwise a Photosynthesis one a plant
function genusOf(built: BuiltNetwork, context: EditorContext): Genus {
  const mainGenera: (Genus | null)[] = [];
  for (const connection of built.network.connections) {
    if (connection.sourceType === NeuronType.SENSOR) mainGenera.push(context.sensors.getGenusMain(connection.sourceId));
    if (connection.sinkType === NeuronType.ACTION) mainGenera.push(context.actions.getGenusMain(connection.sinkId));
  }
  if (mainGenera.includes("attack_plant")) return "attack_plant";
  if (mainGenera.includes("plant")) return "plant";
  return "unknown";
}

/** mass spent each step the brain runs, as CreatureBrain computes it */
export function thinkCost(built: BuiltNetwork, context: EditorContext,
    costs: { SENSOR_COSTS?: Record<string, number>; ACTION_COSTS?: Record<string, number> }): number {
  const sensorIds = new Set<number>();
  const actionIds = new Set<number>();
  for (const connection of built.network.connections) {
    if (connection.sourceType === NeuronType.SENSOR) sensorIds.add(connection.sourceId);
    if (connection.sinkType === NeuronType.ACTION) actionIds.add(connection.sinkId);
  }
  let cost = 0;
  for (const id of sensorIds) cost += costs.SENSOR_COSTS?.[context.sensors.enabledSensors[id]] ?? 0;
  for (const id of actionIds) cost += costs.ACTION_COSTS?.[context.actions.enabledActions[id]] ?? 0;
  return cost;
}

export const clampWeight = (weight: number) => Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, weight));

/** the gene of a connection; the weight is kept between MIN_WEIGHT and MAX_WEIGHT */
export function encodeGene(connection: ConnectionType): Gene {
  const weightBits = Math.round((clampWeight(connection.weight) + 4) * 8192) & 65535;
  return ((connection.sourceType & 1) << 31)
    | ((connection.sourceId & 127) << 24)
    | ((connection.sinkType & 1) << 23)
    | ((connection.sinkId & 127) << 16)
    | weightBits;
}

/** the connection with its ids in range for the context, or an error message */
export function checkConnection(connection: ConnectionType, context: EditorContext): string | null {
  const { sensorCount, actionCount, maxNeurons } = context.counts;
  const inRange = (id: number, count: number) => Number.isInteger(id) && id >= 0 && id < count;
  if (connection.sourceType === NeuronType.SENSOR ? !inRange(connection.sourceId, sensorCount) : !inRange(connection.sourceId, maxNeurons)) {
    return "The source is not an enabled sensor or a neuron below Max neurons.";
  }
  if (connection.sinkType === NeuronType.ACTION ? !inRange(connection.sinkId, actionCount) : !inRange(connection.sinkId, maxNeurons)) {
    return "The target is not an enabled action or a neuron below Max neurons.";
  }
  if (!Number.isFinite(connection.weight)) return "The weight is not a number.";
  return null;
}

export function replaceGene(genes: readonly Gene[], index: number, connection: ConnectionType): Gene[] {
  const result = genes.slice();
  result[index] = encodeGene(connection);
  return result;
}

/** the gene with another weight; source and target stay as they are */
export function setGeneWeight(genes: readonly Gene[], index: number, weight: number): Gene[] {
  const result = genes.slice();
  const weightBits = Math.round((clampWeight(weight) + 4) * 8192) & 65535;
  result[index] = (genes[index] & ~65535) | weightBits;
  return result;
}

export function addGene(genes: readonly Gene[], connection: ConnectionType): Gene[] {
  return [...genes, encodeGene(connection)];
}

/** the genes without the ones the test picks; null if that would leave no gene */
export function removeGenes(genes: readonly Gene[], context: EditorContext,
    test: (connection: ConnectionType, index: number) => boolean): Gene[] | null {
  const result = genes.filter((gene, index) => !test(decodeGene(gene, context.counts), index));
  return result.length === 0 ? null : result;
}

export const removeGeneAt = (genes: readonly Gene[], context: EditorContext, index: number) =>
  removeGenes(genes, context, (_, i) => i === index);

/** every connection from this sensor */
export const removeSensor = (genes: readonly Gene[], context: EditorContext, sensorId: number) =>
  removeGenes(genes, context, (c) => c.sourceType === NeuronType.SENSOR && c.sourceId === sensorId);

/** every connection to this action */
export const removeAction = (genes: readonly Gene[], context: EditorContext, actionId: number) =>
  removeGenes(genes, context, (c) => c.sinkType === NeuronType.ACTION && c.sinkId === actionId);

/** every connection from or to this neuron (its number in the genes) */
export const removeNeuron = (genes: readonly Gene[], context: EditorContext, neuronId: number) =>
  removeGenes(genes, context, (c) =>
    (c.sourceType === NeuronType.NEURON && c.sourceId === neuronId) || (c.sinkType === NeuronType.NEURON && c.sinkId === neuronId));

/** neuron numbers that some gene uses, from 0 to Max neurons - 1 */
export function usedNeuronIds(genes: readonly Gene[], context: EditorContext): number[] {
  const ids = new Set<number>();
  for (const gene of genes) {
    const c = decodeGene(gene, context.counts);
    if (c.sourceType === NeuronType.NEURON) ids.add(c.sourceId);
    if (c.sinkType === NeuronType.NEURON) ids.add(c.sinkId);
  }
  return Array.from(ids).sort((a, b) => a - b);
}

/** the lowest neuron number no gene uses, or -1 when all of them are used */
export function freeNeuronId(genes: readonly Gene[], context: EditorContext): number {
  const used = new Set(usedNeuronIds(genes, context));
  for (let id = 0; id < context.counts.maxNeurons; id++) if (!used.has(id)) return id;
  return -1;
}

export type Endpoint = { type: NeuronType; id: number };

/**
 * A new neuron between a source (sensor or neuron) and a target (neuron or action):
 * two genes, source → neuron and neuron → target. null when every neuron number is used.
 */
export function addNeuron(genes: readonly Gene[], context: EditorContext, source: Endpoint, sink: Endpoint,
    weightIn = 1, weightOut = 1): { genes: Gene[]; neuronId: number } | null {
  const neuronId = freeNeuronId(genes, context);
  if (neuronId < 0) return null;
  const result = addGene(genes, { sourceType: source.type, sourceId: source.id, sinkType: NeuronType.NEURON, sinkId: neuronId, weight: weightIn });
  return {
    genes: addGene(result, { sourceType: NeuronType.NEURON, sourceId: neuronId, sinkType: sink.type, sinkId: sink.id, weight: weightOut }),
    neuronId,
  };
}

/** a gene in hexadecimal, as the app shows and copies genomes */
export const geneToHex = (gene: Gene) => (gene >>> 0).toString(16).padStart(8, "0");

/** the genes of a genome copied from the app: words of 8 hex digits, a JSON array, or a JSON entry with "genome" or "genes" */
export function parseGenomeText(text: string): Gene[] {
  const trimmed = text.trim();
  if (trimmed === "") throw new Error("the text is empty.");
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("it is not valid JSON.");
    }
    const list = Array.isArray(parsed) ? parsed : (parsed as { genome?: unknown; genes?: unknown }).genome ?? (parsed as { genes?: unknown }).genes;
    if (!Array.isArray(list) || list.length === 0 || !list.every((gene) => Number.isInteger(gene))) {
      throw new Error("the JSON has no list of whole numbers.");
    }
    return list.map((gene: number) => gene | 0);
  }
  const words = trimmed.split(/[\s,;]+/).filter((word) => word !== "");
  if (!words.every((word) => /^(0x)?[0-9a-f]{1,8}$/i.test(word))) {
    throw new Error("expected genes of up to 8 hexadecimal digits, separated by spaces.");
  }
  return words.map((word) => parseInt(word.replace(/^0x/i, ""), 16) | 0);
}
