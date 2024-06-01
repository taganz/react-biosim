import CreatureBrain from "./brain/CreatureBrain";
import { NeuronType } from "./brain/Neuron";
import Genome, { geneToString } from "./brain/Genome";
import { Sensor, SensorName } from "./brain/CreatureSensors";
import { ActionName } from "./brain/CreatureActions";
import CreatureActions from "./brain/CreatureActions";
import CreatureSensors from "./brain/CreatureSensors";
import { Gene } from "./brain/Genome";
import WorldGenerations from "../generations/WorldGenerations";
import { ConnectionType } from "./brain/Connection";
import { getRandomItem } from "../helpers/helpers";
import { geneArrayToString } from "./brain/Genome";
export type Genus = "unknown" | "plant" | "attack_plant" |"attack_animal";

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
            weight: -4 + 8 * Math.random()
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
            weight: -4 + 8 * Math.random()
        }
        return (Genome.connectionToGene(connection));
}
    
    static getGenusFromGene(generations: WorldGenerations, gene: Gene): Genus {
        let hasPlant = false;
        let hasAttack = false;
        let hasAttackPlant = false;
        let hasAttackAnimal = false;
        const connection = Genome.geneToConnection(gene, generations);
        if (connection.sourceType == NeuronType.SENSOR) {
            /*
            if (connection.sourceType == NeuronType.SENSOR) {
                const compatibleGenus = generations.sensors.sensorsByCompatibleGenus(connection.sourceId);
                if (compatibleGenus.includes("attack_animal")) hasAttackAnimal = true;
                if (compatibleGenus.includes("attack_plant")) hasAttackPlant = true;
                if (compatibleGenus.includes("plant")) hasPlant = true;
            }
            */
            const mainGenus = generations.sensors.getGenusMain(connection.sourceId);
            if (mainGenus != null) {
                if (mainGenus.includes("attack_animal")) hasAttackAnimal = true;
                else if (mainGenus.includes("attack_plant")) hasAttackPlant = true;
                else if (mainGenus.includes("plant")) hasPlant = true;
            }
        }
        if (connection.sinkType == NeuronType.ACTION) {
            /*
            if (connection.sinkType == NeuronType.ACTION) {
                const compatibleGenus = generations.actions.sensorsByCompatibleGenus(connection.sinkId);
                if (compatibleGenus.includes("attack_animal")) hasAttackAnimal = true;
                if (compatibleGenus.includes("attack_plant")) hasAttackPlant = true;
                if (compatibleGenus.includes("plant")) hasPlant = true;
            }
            */
            const mainGenus = generations.actions.getGenusMain(connection.sinkId);
            if (mainGenus != null) {
                if (mainGenus.includes("attack_animal")) hasAttackAnimal = true;
                else if (mainGenus.includes("attack")) hasAttack = true;
                else if (mainGenus.includes("attack_plant")) hasAttackPlant = true;
                else if (mainGenus.includes("plant")) hasPlant = true;
            }
        }
        if (hasAttackAnimal) return "attack_animal";
        if (hasAttackPlant) return "attack_plant";
        if (hasPlant) return "plant";
        return "unknown";
 
    }

    //TODO should this be a getter in brain?
    static getGenus(brain: CreatureBrain): Genus {
        let hasPlant = false;
        let hasAttack = false;
        let hasAttackPlant = false;
        let hasAttackAnimal = false;
        brain.brain.connections.map(connection => {
            if (connection.sourceType == NeuronType.SENSOR) {
                /*
                const compatibleGenus = brain.sensors.sensorsByCompatibleGenus(connection.sourceId);
                if (compatibleGenus.includes("attack_animal")) hasAttackAnimal = true;
                if (compatibleGenus.includes("attack_plant")) hasAttackPlant = true;
                if (compatibleGenus.includes("plant")) hasPlant = true;
                */
                const mainGenus = brain.sensors.getGenusMain(connection.sourceId);
                if (mainGenus != null) {
                    if (mainGenus === "attack_animal") hasAttackAnimal = true;
                    else if (mainGenus === "attack_plant") hasAttackPlant = true;
                    else if (mainGenus === "plant") hasPlant = true;
                }
            }
            if (connection.sinkType == NeuronType.ACTION) {
                /*
                const compatibleGenus = brain.actions.sensorsByCompatibleGenus(connection.sinkId);
                if (compatibleGenus.includes("attack_animal")) hasAttackAnimal = true;
                if (compatibleGenus.includes("attack_plant")) hasAttackPlant = true;
                if (compatibleGenus.includes("plant")) hasPlant = true;
                */
                const mainGenus = brain.actions.getGenusMain(connection.sinkId);
                if (mainGenus != null) {
                    if (mainGenus === "attack_animal") hasAttackAnimal = true;
                    else if (mainGenus === "attack_plant") hasAttackPlant = true;
                    else if (mainGenus === "plant") hasPlant = true;
                }
            }
        });
        if (hasAttackAnimal) return "attack_animal";
        if (hasAttackPlant) return "attack_plant";
        if (hasPlant) return "plant";
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