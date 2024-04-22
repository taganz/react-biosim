import * as constants from "../simulationConstants"

export default class CreatureMass {
    //_massAtBirth : number;
    _mass : number = 0;
    _basalConsumption : number;

    constructor(genomeLength : number, massAtBirth: number) {
        //this._massAtBirth = massAtBirth
        this._mass = massAtBirth;
        this._basalConsumption = constants.MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE * genomeLength;
    }

    step() {
        this._mass -= this._basalConsumption;
        this._mass = this._mass > 0 ? this._mass : 0;
    }

    
    add(mass: number) {
        this._mass += mass;
    }
    
    consume(mass: number) {
        this._mass -= mass;
    }

    consumeMassFraction(massFraction: number) {
        this._mass -= this._mass * massFraction;
    }
    
    get isAlive() {
        return this._mass > 0;
    }

    get mass() {
        return this._mass;
    }

    set mass(m: number) {
        this._mass = m;
    }
}