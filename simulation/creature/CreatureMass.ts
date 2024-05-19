import Creature from "./Creature";

export default class CreatureMass {
    //_massAtBirth : number;
    _mass : number = 0;
    _basalConsumption : number;
    _metabolismEnabled : boolean;
    _massAtBirth : number; 
    _maxMass : number;

    constructor(creature: Creature) {

        //this._massAtBirth = massAtBirth
        this._mass = creature.massAtBirth;
        this._massAtBirth = creature.massAtBirth;
        this._basalConsumption = creature.generations.worldController._loadedWorldControllerData.MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE * 
                creature.brain.genome.genes.length;
        this._metabolismEnabled = creature.generations.metabolismEnabled;
        this._maxMass = this._massAtBirth 
                * creature.generations.worldController._loadedWorldControllerData.MASS_MAX_MULTIPLE_MASS_AT_BIRT;
    }

    basalMetabolism() : number {
        if (!this._metabolismEnabled) {return 0}
        const basalConsumed = Math.min(this._mass, this._basalConsumption);
        this._mass -= basalConsumed;
        this._mass = this._mass > 0 ? this._mass : 0;
        return basalConsumed;
    }

    
    add(mass: number) {
        if (!this._metabolismEnabled) {return}
        this._mass += mass;
        this._mass = this._mass < this._maxMass 
                    ? this._mass 
                    : this._maxMass;
    }
    
    consume(mass: number) : number {
        if (!this._metabolismEnabled) {return 0}
        const massConsumed = Math.min(mass, this._mass);
        this._mass -= massConsumed;
        this._mass = this._mass > 0 ? this._mass : 0;
        return massConsumed;
    }

    // fraction of massAtBirth!
    consumeMassFraction(massFraction: number) {
        if (!this._metabolismEnabled) {return}
        this._mass -= this._massAtBirth * massFraction;
    }
    
    get isAlive() {
        return this._mass > 0;
    }

    get mass() : number {
        return this._mass;
    }

    set mass(m: number) {
        if (!this._metabolismEnabled) {return}
        this._mass = m;
    }
}