import * as constants from "../simulationConstants"
import Creature from "./Creature";
import {LogEvent, LogLevel} from '@/simulation/logger/LogEvent';

export default class CreatureReproduction {

    _creature : Creature;

    constructor(creature : Creature) {
        this._creature = creature;
    }

    //TODO revisar factor multiplicador segons sortida de l'actuador
    get hasEnoughtMassToReproduce() {
      if (!this._creature._mass._metabolismEnabled) {  //TODO privates!
        return this._creature.mass  > this._creature.massAtBirth 
        * (this._creature.worldControllerData.REPRODUCTION_MULTIPLE_MASS_AT_BIRTH );
      }
      return this._creature.mass  > this._creature.massAtBirth 
      * (this._creature.worldControllerData.REPRODUCTION_MULTIPLE_MASS_AT_BIRTH + this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_DO);
    }
  
    //TODO implement input factor ... 
    reproduce(input: number) : boolean {

      if (!this.hasEnoughtMassToReproduce) {
          this._creature._mass.consumeMassFraction(this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_TRY);    
          this._creature.log(LogEvent.REPRODUCE_TRY, "mass consumed", this._creature.mass*this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_TRY);
          return false;
      }
      const offspringPosition = this._creature.generations.grid.getNearByAvailablePosition(this._creature.position[0], this._creature.position[1]);
      if (offspringPosition) {
        this._creature.generations.newCreature(offspringPosition, this._creature.brain.genome);
        this._creature._mass.consumeMassFraction(this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_DO);    //TODO only if isMetabolismEnabled
        this._creature._mass.consume(this._creature.massAtBirth);
        return true;
      }
      this._creature._mass.consumeMassFraction(this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_TRY);    
      return false;
    }


}