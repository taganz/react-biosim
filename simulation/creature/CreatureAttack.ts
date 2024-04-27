//import {METABOLISM_ENABLED, MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE} from "../simulationConstants"
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

   attack(actionInputValue: number, targetDirection: Direction4) : number {
    const preyPosition = this.grid.cellOffsetDirection4(this.creature.position, targetDirection);
    if (preyPosition != null) {
        const prey = this.grid.cell(preyPosition[0], preyPosition[1]).creature;
        if (prey != null) {
            const preyMass = prey.mass;
            prey.killedByAttack(this.creature.specie);
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