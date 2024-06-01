import { numberToHexColor } from "../../helpers/helpers";
import {
  getRandomHexChar,
  numberToBitString,
  numberToRGBColor,
  paddingLeft,
  probabilityToBool,
} from "../../helpers/helpers";
import { Genus } from "../CreatureGenus";
import { MutationMode } from "./MutationMode";
import { ConnectionType } from "./Connection";
import { NeuronType, neuronTypeToString } from "./Neuron";
import WorldGenerations from "@/simulation/generations/WorldGenerations";

const logMutations = false;
const logBeforeAndAfter = false;
const geneBitSize = 32;

const binaryPad = [...new Array(geneBitSize)].map(() => "0").join("");
const hexadecimalPad = [...new Array(geneBitSize / 4)].map(() => "0").join("");

export const maxGenNumber = Math.pow(2, geneBitSize) - 1;

const decimalPad = maxGenNumber
  .toString()
  .split("")
  .map(() => "0")
  .join("");

export type Gene = number;

export const geneToString = (generations: WorldGenerations, gene: Gene) : string => {
  const connection : ConnectionType = Genome.geneToConnection(gene, generations);
  let str : string = "[";
  if (connection.sourceType === NeuronType.SENSOR) {
    str += generations.sensors.enabledSensors[connection.sourceId].toString();
  } else {
    str += "neuron "+connection.sourceId.toString();
  }
  str += "] ---> " + connection.weight.toFixed(2) + " ---> [";
  if (connection.sinkType === NeuronType.ACTION) {
    str += generations.actions.enabledActions[connection.sinkId].toString();
  } else {
    str += "neuron  "+connection.sinkId.toString();
  }
  str +="]";
  return str;
}

export const geneArrayToString = (generations: WorldGenerations, geneArray: Gene[]) : string => {
  let str = "";
  geneArray.map(gene => {str += geneToString(generations, gene)+"\n"});
  return str;
}


export default class Genome {
  genes: Gene[];

  constructor(genes: Gene[]) {
    this.genes = genes;
  }

  clone(
    allowMutation: boolean = false,
    mutationMode: MutationMode = MutationMode.wholeGene,
    genomeMaxLength: number = 0,
    mutationProbability: number = 0,
    geneInsertionDeletionProbability: number = 0,
    deletionRate: number = 0
  ): Genome {
    const newGenes = this.genes.slice();

    if (allowMutation) {
      if (probabilityToBool(mutationProbability)) {
        // Select a random gene to mutate
        const geneIndex = this.getRandomGeneIndex();
        const originalGene = this.genes[geneIndex];

        if (mutationMode === MutationMode.singleBit) {
          // Select a mask for a random bit in the 32 bits of the gene
          const randomBitMask = 1 << Math.round(Math.random() * geneBitSize);
          // Swap bit in the gene
          let newGene = originalGene;
          newGene ^= randomBitMask;
          newGenes[geneIndex] = newGene;

          if (logMutations) {
            console.log("Mutation");
            if (logBeforeAndAfter) {
              console.log(
                "New:",
                paddingLeft(numberToBitString(originalGene), binaryPad)
              );
              console.log(
                "Old:",
                paddingLeft(numberToBitString(newGene), binaryPad)
              );
            }
          }
        } else if (mutationMode === MutationMode.singleHexDigit) {
          // Get an array of hex digits of the whole gene
          const hexArray = paddingLeft(
            (originalGene >>> 0).toString(16),
            hexadecimalPad
          ).split("");

          // Select a random digit and change it with a random character
          const randomBitIndex: number = Math.round(
            Math.random() * (hexArray.length - 1)
          );
          hexArray[randomBitIndex] = getRandomHexChar();

          // Set new gene
          const newGene = parseInt(hexArray.join(""), 16);
          newGenes[geneIndex] = newGene;

          if (logMutations) {
            console.log("Mutation");
            if (logBeforeAndAfter) {
              console.log(
                "New:",
                paddingLeft(numberToBitString(originalGene), binaryPad)
              );
              console.log(
                "Old:",
                paddingLeft(numberToBitString(newGene), binaryPad)
              );
            }
          }
        } else if (mutationMode === MutationMode.wholeGene) {
          // Set new gene
          const newGene = Genome.generateRandomGene();
          newGenes[geneIndex] = newGene;

          if (logMutations) {
            console.log("Mutation");
            if (logBeforeAndAfter) {
              console.log(
                "New:",
                paddingLeft(numberToBitString(originalGene), binaryPad)
              );
              console.log(
                "Old:",
                paddingLeft(numberToBitString(newGene), binaryPad)
              );
            }
          }
        }
      }

      if (Math.random() < geneInsertionDeletionProbability) {
        if (Math.random() < deletionRate) {
          // Deletion
          if (newGenes.length > 1) {
            const randomIndex = Math.floor(Math.random() * newGenes.length);
            newGenes.splice(randomIndex, 1);
          }
        } else if (newGenes.length < genomeMaxLength) {
          // Insertion
          newGenes.push(Genome.generateRandomGene());
        }
      }
    }

    return new Genome(newGenes);
  }

  addGenes(newGene: Gene[]): void {
    this.genes = this.genes.concat(newGene);

  }
  static generateRandomGene(): Gene {
    let result = 0;
    for (let i = 1; i <= geneBitSize; i++) {
      if (Math.random() < 0.5) {
        // Random flip
        result ^= 1 << i;
      }
    }
    return result;

    // return Math.round(Math.random() * maxGenNumber);
  }

  static addGenesToLength(genes: Gene[], length: number) : Gene[] {
    if (length <= genes.length) return genes;
    return genes.concat([...new Array(length - genes.length)].map(() => Genome.generateRandomGene()));
    
  }

  getRandomGeneIndex() {
    return Math.floor(Math.random() * this.genes.length);
  }

  toBitString(): string {
    return this.genes
      .map((value) => paddingLeft((value >>> 0).toString(2), binaryPad))
      .join(" ");
  }

  toDecimalString(usePad: boolean = true): string {
    if (!usePad) {
      return this.genes.map((value) => value.toString()).join("");
    }

    return this.genes
      .map((value) => paddingLeft(value.toString(), decimalPad))
      .join(" ");
  }

  toHexadecimalString(): string {
    return this.genes
      .map((value) => paddingLeft((value >>> 0).toString(16), hexadecimalPad))
      .join(" ");
  }

  toString(generations: WorldGenerations): string {
    let str = "";
    this.genes.map(gene => {str+=geneToString(generations, gene)+"\n"});
    return str;
  }
  /*
  genesIndexToConnection(index: number): ConnectionType {
    // sourceType, sourceId, sinkType, sinkId, weigth
    // 1 1110001 0 0110101 0001111111100011
    return Genome.geneToConnection(this.genes[index]);
  }
  */

  static geneToConnection(gene : Gene, generations: WorldGenerations) : ConnectionType {
    const connection =  {
      sourceType: (gene >> 31) & 1,
      sourceId: ((gene >> 24) & 127),
      sinkType: (gene >> 23) & 1,
      sinkId: (gene >> 16) & 127,
      weight: (gene & 65535)/8192-4,
    };

    // Renumber sourceId: from random number to one of the available options<
    if (connection.sourceType == NeuronType.SENSOR) {
      connection.sourceId %= generations.sensors.neuronsCount;
    } else {
      connection.sourceId %= generations.maxNumberNeurons;
    }
    // Renumber sinkId
    if (connection.sinkType == NeuronType.ACTION) {
      connection.sinkId %= generations.actions.neuronsCount;
    } else {
      connection.sinkId %= generations.maxNumberNeurons;
    }
    return connection;
  }
  static connectionToGene(data: ConnectionType): Gene {
    
    // Assuming each field's range is correct
    const encoded =
      (data.sourceType & 1) << 31 |
      (data.sourceId & 127) << 24 |
      (data.sinkType & 1) << 23 |
      (data.sinkId & 127) << 16 |
      ((data.weight +4)*8192 & 65535);
  
    return encoded;
  }

  getColorNumber() {
    // We need to generate a number between 0 and 1777216 to create
    // a color from it
    let sum = 0;
    const multiplier = 16777215 / (this.genes.length * maxGenNumber);
    for (let geneIdx = 0; geneIdx < this.genes.length; geneIdx++) {
      sum += this.genes[geneIdx] * multiplier;
    }
    return sum;
  }

  getColor(): string {
    return numberToRGBColor(this.getColorNumber());
  }

  getHexColor(): string {
    return numberToHexColor(this.getColorNumber());
  }

  compare(genome: Genome): boolean {
    if (this.genes.length != genome.genes.length) {
      return false;
    }

    for (let geneIdx = 0; geneIdx < this.genes.length; geneIdx++) {
      if (this.genes[geneIdx] != genome.genes[geneIdx]) {
        return false;
      }
    }

    return true;
  }

}
