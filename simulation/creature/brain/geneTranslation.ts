import { Gene } from "./Genome";
import { NeuronType } from "./Neuron";
import CreatureSensors, { SensorName } from "./CreatureSensors";
import CreatureActions, { ActionName } from "./CreatureActions";

/*
How genes are decoded: a gene stores 7 bit ids, and the decoding takes them modulo the
number of enabled sensors, enabled actions or Max neurons. Changing any of those numbers
during a run (Update simulation) would rewire every brain, so translateGenome() rewrites
the ids for the new settings and the brains stay the same.
*/
export type GeneDecoding = {
  /** enabled sensors in table order: a sensor id is a position in this list */
  sensors: readonly SensorName[];
  /** enabled actions in table order */
  actions: readonly ActionName[];
  maxNeurons: number;
};

export type GenomeTranslation = {
  genes: Gene[];
  /** genes deleted because their sensor or action is no longer enabled */
  removed: number;
  /** genes whose neuron is not below the new Max neurons: they connect to another neuron */
  folded: number;
};

const SOURCE_SHIFT = 24;
const SINK_SHIFT = 16;
const ID_MASK = 127;

/** the decoding a WorldGenerations uses, or the one a draft would use */
export function decodingFromData(data: {
  enabledSensors: SensorName[];
  enabledActions: ActionName[];
  maxNumberNeurons: number;
}): GeneDecoding {
  // the lists in table order, as WorldGenerations builds them
  const sensors = new CreatureSensors();
  sensors.loadFromList(data.enabledSensors);
  const actions = new CreatureActions(0);
  actions.loadFromList(data.enabledActions);
  return { sensors: sensors.enabledSensors, actions: actions.enabledActions, maxNeurons: data.maxNumberNeurons };
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((name, index) => name === b[index]);

/** true when every gene decodes to the same connection with both decodings */
export function sameDecoding(from: GeneDecoding, to: GeneDecoding): boolean {
  return from.maxNeurons === to.maxNeurons && sameList(from.sensors, to.sensors) && sameList(from.actions, to.actions);
}

type IdTranslation = { id: number } | "removed" | "folded";

// a sensor or action id: the same name in the new list
function translateListId(id: number, from: readonly string[], to: readonly string[]): IdTranslation {
  if (from.length === 0) return { id };   // nothing to keep: it did not decode before
  const name = from[id % from.length];
  const position = to.indexOf(name);
  if (position < 0) return "removed";
  // keep the id when it already decodes to the same position, so unaffected genes do not change
  return { id: id % to.length === position ? id : position };
}

// an internal neuron id: the same neuron number, if it still exists
function translateNeuronId(id: number, from: number, to: number): IdTranslation {
  if (from <= 0 || to <= 0) return { id };
  const neuron = id % from;
  if (neuron >= to) return "folded";
  return { id: id % to === neuron ? id : neuron };
}

/** the gene rewritten for the new decoding, or "removed" if its sensor or action is gone */
export function translateGene(gene: Gene, from: GeneDecoding, to: GeneDecoding): { gene: Gene; folded: boolean } | "removed" {
  const sourceId = (gene >> SOURCE_SHIFT) & ID_MASK;
  const sinkId = (gene >> SINK_SHIFT) & ID_MASK;
  const source = ((gene >> 31) & 1) === NeuronType.SENSOR
    ? translateListId(sourceId, from.sensors, to.sensors)
    : translateNeuronId(sourceId, from.maxNeurons, to.maxNeurons);
  const sink = ((gene >> 23) & 1) === NeuronType.ACTION
    ? translateListId(sinkId, from.actions, to.actions)
    : translateNeuronId(sinkId, from.maxNeurons, to.maxNeurons);
  if (source === "removed" || sink === "removed") return "removed";

  // a folded id is left as it is: it decodes modulo the new Max neurons, as before this existed
  const newSource = source === "folded" ? sourceId : source.id;
  const newSink = sink === "folded" ? sinkId : sink.id;
  const folded = source === "folded" || sink === "folded";
  if (newSource === sourceId && newSink === sinkId) return { gene, folded };

  const result = (gene & ~(ID_MASK << SOURCE_SHIFT) & ~(ID_MASK << SINK_SHIFT))
    | (newSource << SOURCE_SHIFT) | (newSink << SINK_SHIFT);
  // genes come signed or unsigned (a hex digit mutation gives unsigned ones): keep the form
  return { gene: gene > 0x7fffffff ? result >>> 0 : result, folded };
}

/*
The genome rewritten so that, with the new decoding, it builds the same brain.
Genes whose sensor or action is no longer enabled are deleted; if that would leave
no gene, the genome keeps its first gene as it was.
*/
export function translateGenome(genes: readonly Gene[], from: GeneDecoding, to: GeneDecoding): GenomeTranslation {
  if (sameDecoding(from, to)) return { genes: genes.slice(), removed: 0, folded: 0 };
  const result: Gene[] = [];
  let removed = 0;
  let folded = 0;
  for (const gene of genes) {
    const translated = translateGene(gene, from, to);
    if (translated === "removed") {
      removed++;
      continue;
    }
    if (translated.folded) folded++;
    result.push(translated.gene);
  }
  if (result.length === 0 && genes.length > 0) {
    result.push(genes[0]);
    removed--;
  }
  return { genes: result, removed, folded };
}

/** how many of these genomes would get a different brain: some gene removed or folded */
export function countChangedBrains(genomes: Iterable<readonly Gene[]>, from: GeneDecoding, to: GeneDecoding): number {
  if (sameDecoding(from, to)) return 0;
  let count = 0;
  for (const genes of genomes) {
    const { removed, folded } = translateGenome(genes, from, to);
    if (removed > 0 || folded > 0) count++;
  }
  return count;
}
