import Creature from "./Creature";
import WorldWater from "../water/WorldWater";
import { GridCell } from "../world/grid/Grid";

export default class CreatureMass {
    //_massAtBirth : number;
    _mass : number = 0;
    _basalConsumption : number;
    _metabolismEnabled : boolean;
    _massAtBirth : number; 
    _maxMass : number;
    _worldWater: WorldWater;
    _creature : Creature;
    
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
        if (firstGeneration) {
            // if first generation, water should be obtained from cloud
            this._worldWater.getWaterFromCloud(this.massAtBirth);
        }

        this._basalConsumption = creature.generations.worldController.simData.worldControllerData.MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE * 
                creature.brain.genome.genes.length;
        this._metabolismEnabled = creature.generations.metabolismEnabled;
        this._maxMass = this._massAtBirth 
                * creature.generations.worldController.simData.worldControllerData.MASS_MAX_MULTIPLE_MASS_AT_BIRT;
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


    basalMetabolism() : number {
        return this.consume(this._basalConsumption);
    }

    
    addFromPrey(mass: number) {
        if (!this._metabolismEnabled) {return}
        this._mass += mass;
        this._mass = this._mass < this._maxMass 
                    ? this._mass 
                    : this._maxMass;
    }

    addFromGrid(cell: GridCell, massWanted: number) {

        if (!this._metabolismEnabled) {return 0}
        const waterGotFromCell = this._worldWater.getWaterFromCell(cell, massWanted);
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

   // fraction of massAtBirth!
   consumeMassFraction(massFraction: number) {
        if (!this._metabolismEnabled) {return}
        this._mass -= this._massAtBirth * massFraction;
        this._worldWater.dissipateWater(this._massAtBirth * massFraction);
    }
    
    die() {
        this._worldWater.returnWaterToCellOrCloud(
            this._creature.generations.worldController.grid.cell(this._creature.position[0], this._creature.position[1]),
            this._mass) 
        this._mass = 0;
        }

}