import {ATTACK_MIN_PREY_MASS_FACTOR, ATTACK_MULTIPLE_MASS_AT_BIRTH, 
    ATTACK_COST_PER_MASS_DO, ATTACK_COST_PER_MASS_TRY} from "../simulationConstants"
import {Direction, Direction4} from '@/simulation/world/direction';
import {Grid} from "@/simulation/world/grid/Grid";
import Creature from "@/simulation/creature/Creature";

export default class CreatureAttack {
    private creature: Creature;
    private grid: Grid;

    constructor(creature: Creature) {
        this.creature = creature;
        this.grid = this.creature.generations.grid;
    }

    //TODO revisar factor multiplicador segons sortida de l'actuador
    get hasEnoughtMassToAttack() {
        return this.creature.mass  > this.creature.massAtBirth 
        * (ATTACK_MULTIPLE_MASS_AT_BIRTH + ATTACK_COST_PER_MASS_DO);
    }

   attack(actionInputValue: number, targetDirection: Direction4) : number {
    const preyPosition = this.grid.cellOffsetDirection4(this.creature.position, targetDirection);
    this.creature._mass.consumeMassFraction(ATTACK_COST_PER_MASS_TRY);    

    if (preyPosition != null) {
        const prey = this.grid.cell(preyPosition[0], preyPosition[1]).creature;
        if (prey != null) {
            if (prey.mass * ATTACK_MIN_PREY_MASS_FACTOR > this.creature.mass) {
                return 0;
            }
            const preyMass = prey.mass;
            prey.killedByAttack(this.creature.specie);
            this.creature._mass.consumeMassFraction(ATTACK_COST_PER_MASS_DO);    
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