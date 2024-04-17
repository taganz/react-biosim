import * as constants from "../simulationConstants"

export default class CreatureMass {
    _massAtBirth : number;
    _mass : number = 0;
    _basalConsumption : number;

    constructor(genomeLength : number, massAtBirth?: number) {
        this._massAtBirth = massAtBirth ? massAtBirth : constants.CREATURE_MASS_GENERATION_0;
        this._mass = this._massAtBirth;
        this._basalConsumption = constants.CREATURE_BASAL_MASS_CONSUMPTION_PER_BRAIN_SIZE * genomeLength;
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

    get isAlive() {
        return this._mass > 0;
    }

    get mass() {
        return this._mass;
    }
}