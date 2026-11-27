import {Direction4} from '@/simulation/world/direction';
import {Grid} from "@/simulation/world/grid/Grid";
import Creature from "@/simulation/creature/Creature";
import WorldControllerData from '../world/WorldControllerData';
import { randomInt } from '@/simulation/helpers/random';

const neighbours4X = [0, 1, -1, 0];
const neighbours4Y = [1, 0, 0, -1];
const neighbours4Direction : Direction4[] = ["S", "E", "W", "N"];
// indices of the neighbours that can be eaten, found by findPreyDirection.
// Shared, but filled and read within one call: canEat does not search for prey
const preyNeighbours = new Int8Array(8);

export default class CreatureAttack {
    private creature: Creature;
    private grid: Grid;
    private worldControllerData: WorldControllerData;


    constructor(creature: Creature) {
        this.creature = creature;
        this.grid = this.creature.generations.grid;
        this.worldControllerData = this.creature.generations.worldController.simData.worldControllerData;
    }

    // only attack genus eat, never a prey heavier than mass / ATTACK_MIN_PREY_MASS_FACTOR, nor their own
    // genus, or with ATTACK_SAME_GENUS only their own species
    canEat(prey: Creature | null) : boolean {
        if (prey == null || prey === this.creature || !prey.isAlive) return false;
        if (!this.isAttackGenus) return false;
        if (prey._genus == this.creature._genus) {
            if (!this.worldControllerData.ATTACK_SAME_GENUS) return false;
            if (prey.brain.genome.compare(this.creature.brain.genome)) return false;
        }
        return prey.mass * this.worldControllerData.ATTACK_MIN_PREY_MASS_FACTOR <= this.creature.mass;
    }

    // only these genera eat: for the others canEat is always false
    private get isAttackGenus() : boolean {
        return this.creature._genus === "attack_plant";
    }

    private creatureAt(x: number, y: number) : Creature | null {
        if (!this.grid.isTileInsideWorld(x, y)) return null;
        return this.grid.cell(x, y).creature;
    }

    // a random neighbour (N, E, S or W) that can be eaten, every one with the same probability;
    // null if there is none
    findPreyDirection() : Direction4 {
        if (!this.isAttackGenus) return null;
        const [x, y] = this.creature.position;
        let count = 0;
        for (let i = 0; i < 4; i++) {
            if (this.canEat(this.creatureAt(x + neighbours4X[i], y + neighbours4Y[i]))) preyNeighbours[count++] = i;
        }
        if (count === 0) return null;
        return neighbours4Direction[preyNeighbours[count === 1 ? 0 : randomInt(count)]];
    }

    // returns preyMass or 0 if prey not killed
   attack(actionInputValue: number, targetDirection: Direction4) : number {
    const preyPosition = this.grid.cellOffsetDirection4(this.creature.position, targetDirection);
    if (preyPosition != null) {
        const prey = this.grid.cell(preyPosition[0], preyPosition[1]).creature;
        // check before paying the try: the cost could leave the attacker too light for the prey it found
        const canEat = this.canEat(prey);
        this.creature._mass.consumeForAttack(this.worldControllerData.ATTACK_COST_PER_MASS_TRY);
        if (!canEat) {
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
        const eaten = this.creature._mass.eat(prey._mass);
        if (prey._genus === "plant") {
            this.creature.waterFromPlants += eaten;
            this.creature.plantKillCount++;
        } else {
            this.creature.waterFromAnimals += eaten;
            this.creature.animalKillCount++;
        }
        prey.killedByAttack(this.creature.speciesId);
        this.creature._mass.consumeForAttack(this.worldControllerData.ATTACK_COST_PER_MASS_DO);
        return preyMass;
   }

}
