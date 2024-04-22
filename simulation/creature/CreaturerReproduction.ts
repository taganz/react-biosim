import * as constants from "../simulationConstants"
import Creature from "./Creature";

export default class CreatureReproduction {

    _creature : Creature;

    constructor(creature : Creature) {
        this._creature = creature;
    }

    //TODO revisar factor multiplicador segons sortida de l'actuador
    get hasEnoughtMassToReproduce() {
        return this._creature.mass * 2 > this._creature.massAtBirth + this._creature.mass* (1+constants.REPRODUCTION_COST_PER_MASS_DO);
    }
  
    //TODO implement input factor ... 
    reproduce(input: number) : boolean {

      if (!this.hasEnoughtMassToReproduce) {
          this._creature._mass.consumeMassFraction(constants.REPRODUCTION_COST_PER_MASS_TRY);    
          return false;
      }
      const offspringPosition = this._creature.generations.grid.getNearByAvailablePosition(this._creature.position[0], this._creature.position[1]);
      if (offspringPosition) {
        this._creature.generations.newCreature(offspringPosition, this._creature.massAtBirth, this._creature.brain.genome);
        this._creature._mass.consumeMassFraction(constants.REPRODUCTION_COST_PER_MASS_DO);    
        return true;
      }
      this._creature._mass.consumeMassFraction(constants.REPRODUCTION_COST_PER_MASS_TRY);    
      return false;
    }


}