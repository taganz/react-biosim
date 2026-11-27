import { random } from "@/simulation/helpers/random";
import CreatureBrain from "./brain/CreatureBrain";
import { NeuronType } from "./brain/Neuron";
import Genome from "./brain/Genome";
import { Gene } from "./brain/Genome";
import WorldGenerations from "../generations/WorldGenerations";
import { ConnectionType } from "./brain/Connection";
import { getRandomItem } from "../helpers/helpers";
export type Genus = "unknown" | "plant" | "attack_plant";

export default class CreatureGenus {
    
    constructor() {
    }

    
    
     // returns gene UP TO genus
    static randomGeneForGenus (generations: WorldGenerations, genus: Genus, ) : Gene {
        let compatibleGenus : string[];
        const source = getRandomItem(generations.sensors.enabledSensorsForGenus(genus));
        const sink = getRandomItem(generations.actions.enabledActionsForGenus(genus));
        
        const connection : ConnectionType = {
            sourceType: NeuronType.SENSOR,
            sourceId: generations.enabledSensors.indexOf(source),
            sinkType: NeuronType.ACTION,
            sinkId: generations.enabledActions.indexOf(sink),
            weight: -4 + 8 * random()
        }
        return (Genome.connectionToGene(connection));
    }

    // returns a mainGene for genus
    static mainGeneForGenus (generations: WorldGenerations, genus: Genus, ) : Gene {
        let compatibleGenus : string[];
        const source = getRandomItem(generations.sensors.enabledSensorsForGenus(genus));
        const sink = getRandomItem(generations.actions.actionsByMainGenus(genus)); //TODO <---
        
        const connection : ConnectionType = {
            sourceType: NeuronType.SENSOR,
            sourceId: generations.enabledSensors.indexOf(source),
            sinkType: NeuronType.ACTION,
            sinkId: generations.enabledActions.indexOf(sink),
            weight: -4 + 8 * random()
        }
        return (Genome.connectionToGene(connection));
}
    
    static getGenusFromGene(generations: WorldGenerations, gene: Gene): Genus {
        const connection = Genome.geneToConnection(gene, generations);
        return CreatureGenus.genusFromMainGenera([
            connection.sourceType == NeuronType.SENSOR ? generations.sensors.getGenusMain(connection.sourceId) : null,
            connection.sinkType == NeuronType.ACTION ? generations.actions.getGenusMain(connection.sinkId) : null,
        ]);
    }

    //TODO should this be a getter in brain?
    static getGenus(brain: CreatureBrain): Genus {
        const mainGenera: (Genus | null)[] = [];
        for (const connection of brain.brain.connections) {
            if (connection.sourceType == NeuronType.SENSOR) mainGenera.push(brain.sensors.getGenusMain(connection.sourceId));
            if (connection.sinkType == NeuronType.ACTION) mainGenera.push(brain.actions.getGenusMain(connection.sinkId));
        }
        return CreatureGenus.genusFromMainGenera(mainGenera);
    }

    // an Attack gene makes an animal, otherwise a Photosynthesis gene makes a plant
    private static genusFromMainGenera(mainGenera: (Genus | null)[]): Genus {
        if (mainGenera.includes("attack_plant")) return "attack_plant";
        if (mainGenera.includes("plant")) return "plant";
        return "unknown";
    }

/*
    // return an array of a given lenght with all genes of genus type or lower
    static geneArrayForGenus (generations: WorldGenerations, genus: Genus, length: number): Gene[] {
        let geneArray : Gene[] = [];
        geneArray.push(this.randomGeneForGenus(generations, genus));
        geneArray = Genome.addGenesToLength(geneArray, length);
        for (let i = 0; i< geneArray.length; i++) {
            let preventLoop = 1000;
            while (this.getGenusFromGene(generations, geneArray[i]) != genus) {
                geneArray[i] = this.randomGeneForGenus(generations, genus);
                console.log("----", i, geneArray[i], geneToString(generations, geneArray[i]), this.getGenusFromGene(generations, geneArray[i]));
                if (preventLoop-- <= 0) {
                    throw Error(`infite loop in geneArray ${geneArray} ${i} ${genus}`)
                }

            }
        }
        return geneArray;
    }
*/
    // return an array of a given lenght with one main gene and other of genus type or lower
    static geneArrayForGenus (generations: WorldGenerations, genus: Genus, length: number): Gene[] {
        let geneArray : Gene[] = [];
        geneArray.push(this.mainGeneForGenus(generations, genus));
        //console.log("-1-", genus, geneArrayToString(generations, geneArray));
        for (let i = 1; i< length; i++) {
            geneArray.push(this.randomGeneForGenus(generations, genus));
        }
        //console.log("-2-", genus, geneArrayToString(generations, geneArray));
        return geneArray;
    }
}