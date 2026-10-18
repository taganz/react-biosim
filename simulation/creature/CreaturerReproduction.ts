import Creature from "./Creature";
import {LogEvent} from '@/simulation/logger/LogEvent';

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
  
    // called only with enough mass (see Creature.reproduce)
    //TODO implement input factor ... 
    reproduce(input: number) : boolean {
      const offspringPosition = this._creature.generations.grid.getNearByAvailablePosition(this._creature.position[0], this._creature.position[1])
        ?? this._creature.eatNeighbourForOffspring();
      if (offspringPosition) {
        const child = this._creature.generations.newCreature(offspringPosition, false, this._creature.brain.genome, this._creature);
        this._creature._mass.consumeMassFraction(this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_DO);    //TODO only if isMetabolismEnabled
        // the child's birth mass comes from the parent, so the total water is kept
        child._mass._mass = this._creature._mass.giveToChild(child.massAtBirth);
        return true;
      }
      const consumed = this._creature._mass.consumeMassFraction(this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_TRY);    
      this._creature.log(LogEvent.REPRODUCE_TRY, "mass consumed", consumed);
      return false;
    }


}
