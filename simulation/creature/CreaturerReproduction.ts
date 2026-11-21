import Creature from "./Creature";
import {LogEvent} from '@/simulation/logger/LogEvent';

/** REPRODUCTION_OFFSPRING_MAX_DISTANCE_PERCENT of files saved without it */
export const OFFSPRING_MAX_DISTANCE_PERCENT_MISSING = 4;

/** cells from the parent at which a child can be born: the percentage of the world size, rounded, at least 1 */
export function offspringMaxDistance(percent: number | undefined, worldSize: number): number {
  return Math.max(1, Math.round(worldSize * (percent ?? OFFSPRING_MAX_DISTANCE_PERCENT_MISSING) / 100));
}

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
      const grid = this._creature.generations.grid;
      const maxDistance = offspringMaxDistance(this._creature.worldControllerData.REPRODUCTION_OFFSPRING_MAX_DISTANCE_PERCENT, grid.size);
      const offspringPosition = grid.getFarthestAvailablePosition(this._creature.position[0], this._creature.position[1], maxDistance)
        ?? this._creature.eatNeighbourForOffspring();
      if (offspringPosition) {
        const child = this._creature.generations.newCreature(offspringPosition, false, this._creature.brain.genome, this._creature);
        this._creature._mass.consumeForReproduction(this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_DO);    //TODO only if isMetabolismEnabled
        // the child's birth mass comes from the parent, so the total water is kept
        child._mass.setStartMass(this._creature._mass.giveToChild(child.massAtBirth));
        return true;
      }
      const consumed = this._creature._mass.consumeForReproduction(this._creature.worldControllerData.REPRODUCTION_COST_PER_MASS_TRY);    
      this._creature.log(LogEvent.REPRODUCE_TRY, "mass consumed", consumed);
      return false;
    }


}
