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
        const child = this._creature.generations.newCreature(offspringPosition, false, this._creature.brain.genome, this._creature);
        this._creature._mass.consumeMassFraction(this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_DO);    //TODO only if isMetabolismEnabled
        // the child's birth mass comes from the parent, so the total water is kept
        child._mass._mass = this._creature._mass.giveToChild(child.massAtBirth);
        return true;
      }
      this._creature._mass.consumeMassFraction(this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_TRY);    
      return false;
    }


}