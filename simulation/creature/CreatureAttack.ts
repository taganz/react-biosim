import {Direction4} from '@/simulation/world/direction';
import {Grid} from "@/simulation/world/grid/Grid";
import Creature from "@/simulation/creature/Creature";
import WorldControllerData from '../world/WorldControllerData';
import { shuffle } from '@/simulation/helpers/random';

const neighbours4 : [number, number, Direction4][] = [[0, 1, "S"], [1, 0, "E"], [-1, 0, "W"], [0, -1, "N"]];
const neighbours8 : [number, number][] = [[-1, 0], [-1, 1], [1, -1], [1, 1], [-1, -1], [1, 0], [0, -1], [0, 1]];

export default class CreatureAttack {
    private creature: Creature;
    private grid: Grid;
    private worldControllerData: WorldControllerData;


    constructor(creature: Creature) {
        this.creature = creature;
        this.grid = this.creature.generations.grid;
        this.worldControllerData = this.creature.generations.worldController.simData.worldControllerData;
    }

    // only attack genus eat, never their own genus nor a prey heavier than mass / ATTACK_MIN_PREY_MASS_FACTOR
    canEat(prey: Creature | null) : boolean {
        if (prey == null || prey === this.creature || !prey.isAlive) return false;
        if (this.creature._genus !== "attack_plant" && this.creature._genus !== "attack_animal") return false;
        if (prey._genus == this.creature._genus) return false;
        return prey.mass * this.worldControllerData.ATTACK_MIN_PREY_MASS_FACTOR <= this.creature.mass;
    }

    private creatureAt(x: number, y: number) : Creature | null {
        if (!this.grid.isTileInsideWorld(x, y)) return null;
        return this.grid.cell(x, y).creature;
    }

    // direction (N, E, S or W) of a neighbour that can be eaten, in random order; null if there is none
    findPreyDirection() : Direction4 {
        const [x, y] = this.creature.position;
        for (const [dx, dy, direction] of shuffle(neighbours4)) {
            if (this.canEat(this.creatureAt(x + dx, y + dy))) return direction;
        }
        return null;
    }

    // a neighbour in the 8 surrounding cells that can be eaten, in random order; null if there is none
    findPreyAround() : Creature | null {
        const [x, y] = this.creature.position;
        for (const [dx, dy] of shuffle(neighbours8)) {
            const prey = this.creatureAt(x + dx, y + dy);
            if (this.canEat(prey)) return prey;
        }
        return null;
    }

    // returns preyMass or 0 if prey not killed
   attack(actionInputValue: number, targetDirection: Direction4) : number {
    this.creature._mass.consume(this.worldControllerData.ATTACK_COST_PER_MASS_TRY);
    const preyPosition = this.grid.cellOffsetDirection4(this.creature.position, targetDirection);
    if (preyPosition != null) {
        const prey = this.grid.cell(preyPosition[0], preyPosition[1]).creature;
        if (!this.canEat(prey)) {
            return 0;
        }
        return this.eat(prey!);
    } else {
        console.log("attack preyPosition null", this.creature.position, targetDirection);
        return 0;
    }

   }

   // kills the prey and takes its mass; returns the mass the prey had
   eat(prey: Creature) : number {
        const preyMass = prey.mass;
        this.creature.waterFromPrey += this.creature._mass.eat(prey._mass);
        prey.killedByAttack(this.creature.specie);
        this.creature._mass.consume(this.worldControllerData.ATTACK_COST_PER_MASS_DO);
        return preyMass;
   }

}
