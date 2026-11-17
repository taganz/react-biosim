import Creature from "./Creature";
import WorldWater from "../water/WorldWater";
import { GridCell } from "../world/grid/Grid";
import WorldGenerations from "../generations/WorldGenerations";
import Genome, { Gene } from "./brain/Genome";
import { NeuronType } from "./brain/Neuron";
import { ActionName } from "./brain/CreatureActions";
import { Genus } from "./CreatureGenus";

// primary: the first Reproduction gene and, in plants, the first Photosynthesis gene
export interface GeneCounts { primary: number; stamina: number; other: number }

export default class CreatureMass {
    //_massAtBirth : number;
    _mass : number = 0;
    _basalConsumption : number;   // every step: the genes
    _thinkCost : number;          // also in the steps the brain runs: its sensors and actions
    private _basalConsumptionThinking : number;
    _metabolismEnabled : boolean;
    _massAtBirth : number; 
    _maxMass : number;
    _worldWater: WorldWater;
    _creature : Creature;
    // mass spent over the creature's life, shown in the creature panel
    totalBasal : number = 0;            // the genes (basal consumption)
    totalThinking : number = 0;         // the sensors and actions of the brain, in the steps it thinks
    totalMoving : number = 0;           // moving
    totalAttacking : number = 0;        // attacking (the mass eaten is Creature.waterFromPrey)
    totalReproductionCost : number = 0; // reproduction attempts and births
    totalGivenToChildren : number = 0;  // birth mass of the children
    startMass : number;                 // the mass it got at birth, or had when it was loaded from a file
    genes : GeneCounts;                 // the genes by how much they cost
    
    constructor(creature: Creature, firstGeneration: boolean) {

        this._creature = creature;
        this._worldWater = creature.generations.worldController.worldWater;
        switch(creature._genus)   {
            case "plant":
            case "unknown":
            this._massAtBirth = creature.generations.worldController.simData.worldControllerData.MASS_AT_BIRTH_PLANT;
            break;
            case "attack_plant":
            this._massAtBirth = creature.generations.worldController.simData.worldControllerData.MASS_AT_BIRTH_ATTACK_PLANT;
            break;
            case "attack_animal":
            this._massAtBirth = creature.generations.worldController.simData.worldControllerData.MASS_AT_BIRTH_ATTACK_ANIMAL;
            break;
            default:
            console.error("genus unknown ", creature._genus);
            this._massAtBirth = 1;
        }

        this._mass = this._massAtBirth;
        this.startMass = this._mass;
        if (firstGeneration) {
            // if first generation, water should be obtained from cloud
            this._worldWater.getWaterFromCloud(this.massAtBirth);
        }

        this.genes = CreatureMass.geneCounts(creature.generations, creature.brain.genome.genes, creature._genus);
        this._basalConsumption = CreatureMass.basalFromCounts(creature.generations, this.genes);
        this._thinkCost = creature.brain.thinkCost;
        this._basalConsumptionThinking = this._basalConsumption + this._thinkCost;
        this._metabolismEnabled = creature.generations.metabolismEnabled;
        this._maxMass = this._massAtBirth 
                * creature.generations.worldController.simData.worldControllerData.MASS_MAX_MULTIPLE_MASS_AT_BIRT;
    }

    // the first gene that drives Reproduction and, in plants only, the first that drives Photosynthesis cost
    // MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY; every other gene costs MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE
    // Paid every step. Stamina genes cost nothing: with the Stamina action every genome has one
    static basalConsumption(generations: WorldGenerations, genes: Gene[], genus: Genus): number {
        return CreatureMass.basalFromCounts(generations, CreatureMass.geneCounts(generations, genes, genus));
    }

    static basalFromCounts(generations: WorldGenerations, genes: GeneCounts): number {
        const data = generations.worldController.simData.worldControllerData;
        return data.MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY * genes.primary
            + data.MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE * genes.other;
    }

    static geneCounts(generations: WorldGenerations, genes: Gene[], genus: Genus): GeneCounts {
        const primaryActions: ActionName[] = genus === "plant" ? ["Photosynthesis", "Reproduction"] : ["Reproduction"];
        const primaryFound = new Set<ActionName>();
        let staminaGenes = 0;
        for (const gene of genes) {
            const connection = Genome.geneToConnection(gene, generations);
            if (connection.sinkType !== NeuronType.ACTION) continue;
            const action = generations.enabledActions[connection.sinkId];
            if (primaryActions.includes(action)) primaryFound.add(action);
            if (action === "Stamina") staminaGenes++;
        }
        const primary = primaryFound.size;
        return { primary, stamina: staminaGenes, other: genes.length - primary - staminaGenes };
    }

    get isAlive() {
        return this._mass > 0;
    }

    get mass() : number {
        return this._mass;
    }

    get massAtBirth(): number {
        return this._massAtBirth;
    }


    // the genes every step, and the sensors and actions of the brain when it runs (see stamina)
    basalMetabolism(thinks: boolean = true) : number {
        const consumed = this.consume(thinks ? this._basalConsumptionThinking : this._basalConsumption);
        // the genes are paid first
        const basal = Math.min(consumed, this._basalConsumption);
        this.totalBasal += basal;
        this.totalThinking += consumed - basal;
        return consumed;
    }

    // the cost of moving
    consumeForMove(mass: number) : number {
        const consumed = this.consume(mass);
        this.totalMoving += consumed;
        return consumed;
    }

    // the cost of attacking
    consumeForAttack(mass: number) : number {
        const consumed = this.consume(mass);
        this.totalAttacking += consumed;
        return consumed;
    }

    // the cost of a reproduction attempt or birth, as a fraction of massAtBirth
    consumeForReproduction(massFraction: number) : number {
        const consumed = this.consumeMassFraction(massFraction);
        this.totalReproductionCost += consumed;
        return consumed;
    }

    
    // takes the prey's mass, up to the maximum mass; the water stays inside creatures.
    // Called before the prey dies, so whatever is left returns to its cell. Returns the mass taken
    eat(prey: CreatureMass): number {
        if (!this._metabolismEnabled) {return 0}
        const eaten = Math.max(0, Math.min(prey._mass, this._maxMass - this._mass));
        prey._mass -= eaten;
        this._mass += eaten;
        return eaten;
    }

    addFromGrid(cell: GridCell, massWanted: number) {

        if (!this._metabolismEnabled) {return 0}
        // never take more water than fits, or it would be lost
        const room = Math.max(0, this._maxMass - this._mass);
        const waterGotFromCell = this._worldWater.getWaterFromCell(cell, Math.min(massWanted, room));
        this._mass += waterGotFromCell;
        this._mass = this._mass < this._maxMass 
                    ? this._mass 
                    : this._maxMass;
        return waterGotFromCell;
    }

    consume(mass: number) : number {
        if (!this._metabolismEnabled) {return 0}
        const massConsumed = Math.min(mass, this._mass);
        this._mass -= massConsumed;
        this._mass = this._mass > 0 ? this._mass : 0;
        this._worldWater.dissipateWater(massConsumed);
        return massConsumed;
    }

   // fraction of massAtBirth! Like consume, it never takes more than the creature has
   consumeMassFraction(massFraction: number) : number {
        return this.consume(this._massAtBirth * massFraction);
    }

    // the mass of a newborn child, or of a creature loaded from a file: where its balance starts
    setStartMass(mass: number) {
        this._mass = mass;
        this.startMass = mass;
    }

    // keeps the balance of a creature recreated in a new run
    copyTotals(source: CreatureMass) {
        this.startMass = source.startMass;
        this.totalBasal = source.totalBasal;
        this.totalThinking = source.totalThinking;
        this.totalMoving = source.totalMoving;
        this.totalAttacking = source.totalAttacking;
        this.totalReproductionCost = source.totalReproductionCost;
        this.totalGivenToChildren = source.totalGivenToChildren;
    }

    // gives mass to a newborn child: the water stays inside creatures. Returns the mass given
    giveToChild(mass: number): number {
        if (!this._metabolismEnabled) {return mass}
        const given = Math.min(mass, this._mass);
        this._mass -= given;
        this.totalGivenToChildren += given;
        return given;
    }
    
    die() {
        this._worldWater.returnWaterToCellOrCloud(
            this._creature.generations.worldController.grid.cell(this._creature.position[0], this._creature.position[1]),
            this._mass) 
        this._mass = 0;
        }

}