import {Direction4} from '@/simulation/world/direction';
import {Grid} from "@/simulation/world/grid/Grid";
import Creature from "@/simulation/creature/Creature";
import WorldControllerData from '../world/WorldControllerData';

export default class CreatureAttack {
    private creature: Creature;
    private grid: Grid;
    private worldControllerData: WorldControllerData;


    constructor(creature: Creature) {
        this.creature = creature;
        this.grid = this.creature.generations.grid;
        this.worldControllerData = this.creature.generations.worldController.simData.worldControllerData;
    }

    //TODO revisar factor multiplicador segons sortida de l'actuador
    get hasEnoughtMassToAttack() {
        if (!this.creature._mass._metabolismEnabled) {   //TODO 
            return true;
          }
        return this.creature.mass  > this.creature.massAtBirth 
        * (this.worldControllerData.ATTACK_MULTIPLE_MASS_AT_BIRTH 
            + this.worldControllerData.ATTACK_COST_PER_MASS_DO);
    }

    // returns preyMass or 0 if prey not killed
   attack(actionInputValue: number, targetDirection: Direction4) : number {
    if (!this.hasEnoughtMassToAttack) {
        return 0;
    }
    this.creature._mass.consumeMassFraction(this.worldControllerData.ATTACK_COST_PER_MASS_TRY);    
    const preyPosition = this.grid.cellOffsetDirection4(this.creature.position, targetDirection);
    if (preyPosition != null) {
        const prey = this.grid.cell(preyPosition[0], preyPosition[1]).creature;
        if (prey != null) {
            if (prey.mass * this.worldControllerData.ATTACK_MIN_PREY_MASS_FACTOR > this.creature.mass) {
                return 0;
            }
            if (prey._genus == this.creature._genus) {
                return 0;
            }
            const preyMass = prey.mass;
            prey.killedByAttack(this.creature.specie);
            this.creature._mass.consumeMassFraction(this.worldControllerData.ATTACK_COST_PER_MASS_DO);    
            return preyMass;
        } else {
            console.error("prey is null");
            return 0;
        }
    } else {
        console.log("attack preyPosition null", this.creature.position, targetDirection);
        return 0;
    }

   }

}