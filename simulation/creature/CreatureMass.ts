import {METABOLISM_ENABLED, MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE} from "../simulationConstants"

export default class CreatureMass {
    //_massAtBirth : number;
    _mass : number = 0;
    _basalConsumption : number;
    _metabolismEnabled : boolean;

    constructor(genomeLength : number, massAtBirth: number, _metabolismEnabled = METABOLISM_ENABLED) {
        //this._massAtBirth = massAtBirth
        this._mass = massAtBirth;
        this._basalConsumption = MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE * genomeLength;
        this._metabolismEnabled = _metabolismEnabled;
    }

    basalMetabolism() {
        if (!this._metabolismEnabled) {return}
        
        this._mass -= this._basalConsumption;
        this._mass = this._mass > 0 ? this._mass : 0;
    }

    
    add(mass: number) {
        if (!this._metabolismEnabled) {return}
        this._mass += mass;
    }
    
    consume(mass: number) {
        if (!this._metabolismEnabled) {return}
        this._mass -= mass;
    }

    consumeMassFraction(massFraction: number) {
        if (!this._metabolismEnabled) {return}
        this._mass -= this._mass * massFraction;
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