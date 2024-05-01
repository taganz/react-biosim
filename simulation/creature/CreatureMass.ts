import {MASS_METABOLISM_ENABLED
        , MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE
        , MASS_MAX_MULTIPLE_MASS_AT_BIRT} from "../simulationConstants"

export default class CreatureMass {
    //_massAtBirth : number;
    _mass : number = 0;
    _basalConsumption : number;
    _metabolismEnabled : boolean;
    _massAtBirth : number; 
    _maxMass : number;

    constructor(genomeLength : number, massAtBirth: number, _metabolismEnabled: boolean) {
        //this._massAtBirth = massAtBirth
        this._mass = massAtBirth;
        this._massAtBirth = massAtBirth;
        this._basalConsumption = MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE * genomeLength;
        this._metabolismEnabled = _metabolismEnabled;
        this._maxMass = this._massAtBirth * MASS_MAX_MULTIPLE_MASS_AT_BIRT;
    }

    basalMetabolism() {
        if (!this._metabolismEnabled) {return}
        
        this._mass -= this._basalConsumption;
        this._mass = this._mass > 0 ? this._mass : 0;
    }

    
    add(mass: number) {
        if (!this._metabolismEnabled) {return}
        this._mass += mass;
        this._mass = this._mass < this._maxMass 
                    ? this._mass 
                    : this._maxMass;
    }
    
    consume(mass: number) {
        if (!this._metabolismEnabled) {return}
        this._mass -= mass;
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