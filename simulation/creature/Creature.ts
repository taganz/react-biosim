import WorldGenerations from "../generations/WorldGenerations";
import Genome from "./brain/Genome";
import { probabilityToBool } from "../helpers/helpers";
import { random } from "../helpers/random";
import {GridPosition } from "../world/grid/Grid";
import CreatureMass from "./CreatureMass";
import CreatureAttack from "./CreatureAttack";
import CreatureReproduction from "./CreaturerReproduction";
import CreatureBrain from "./brain/CreatureBrain";
import { speciesOfChild } from "./speciesId";
import {Direction, Direction4} from '@/simulation/world/direction';
import CreaturePhenothype from "./CreaturePhenothype";
import CreatureGenus, {Genus} from "./CreatureGenus";
import WorldControllerData from "../world/WorldControllerData";
import { PhenoTypeColorMode } from "./PhenoTypeColorMode";

export const maxHealth = 100;

// the reasons passed to die()
export type DeathCause = "old" | "basalConsumption" | "attacked" | "health" | "unknown";

const distanceStraightMin = 35;   // <--- ajustar, passar a parametres de la simulacio?
const distanceStraightMax = 120;   // <--- ajustar, passar a parametres de la simulacio?  - treure?
const stepsStoppedPenalization = 100;

  

export default class Creature {
  generations: WorldGenerations;
  worldControllerData : WorldControllerData;

  id : number;
  stepBirth : number;  
  //massAtBirth : number;
    
  // Position
  position: GridPosition;
  lastPosition: GridPosition;
  urgeToMove: [number, number];
  lastMovement: [number, number];

 
  // Activity
  distancePartial : number = 0;
  distanceCovered : number = 0;
  stepsStopped : number = 0;
  lastDirection : Direction = null;
  stepDirection : Direction = null;

  // body and brain
  _mass : CreatureMass;
  _attack : CreatureAttack;
  reproduction : CreatureReproduction;
  brain : CreatureBrain;
  _genus : Genus;
  _age : number = 0;
  // stamina accumulated towards the next run of the brain: it runs when this reaches 1
  thinkCharge : number = 0;

  // Life history, shown in the Population tab
  parentId : number | null = null;   // null for creatures of the first generation
  parentBirthGen : number | null = null;  // ids can restart every generation, so the id alone is ambiguous
  birthGen : number;
  // index of the spawn area of its lineage (see spawnZones.ts), inherited from the parent; null without one
  spawnZone : number | null = null;
  childrenCount : number = 0;
  attackCount : number = 0;          // every attack action, including the ones without enough mass
  killCount : number = 0;
  thinkCount : number = 0;           // steps in which the brain ran
  waterFromPhotosynthesis : number = 0;
  waterFromPrey : number = 0;        // the mass it gained from its prey, up to its maximum mass
  deathCause : DeathCause | null = null;
  deathStep : number | null = null;
  deathGen : number | null = null;
  /** speciesId of the creature that killed it */
  killedBySpecies : string | null = null;
  // the lineage (see speciesId.ts): its species and the species that species came from
  speciesId : string;
  speciesParentId : string | null;
  //_worldWater : WorldWater;
  
  private _health: number = maxHealth;

  // firstGeneration creatures get mass from waterInCloud
  // firstGeneration creatures can receive a genome to spawn a specific genus
  constructor(generations: WorldGenerations, position: GridPosition, firstGeneration: boolean, genome?: Genome) {
    
    this.generations = generations;
    this.worldControllerData = generations.worldController.simData.worldControllerData;

    this.id = generations.lastCreatureIdCreated + 1;
    this.stepBirth = generations.worldController.currentStep;
    this.birthGen = generations.worldController.currentGen;
    
    // Position
    this.position = position;
    this.lastPosition = [position[0], position[1]];
    this.urgeToMove = [0, 0];
    this.lastMovement = [0, 0];

    if (!genome) {
      //1/6/24 remove adding plants genes if metabolism enabled, plants can be added from simulationdatadefaults
      //const randomGenesToAdd = this.generations.initialGenomeSize - (this.generations.metabolismEnabled ? this.generations.worldGenerationsData.plantGenes.length : 0);
      //const newGenome = new Genome(
      //  [...new Array(randomGenesToAdd)].map(() => Genome.generateRandomGene()));
      //if (this.generations.metabolismEnabled) {
      //  newGenome.addGenes(this.generations.worldGenerationsData.plantGenes);
      //}
      const randomGenesToAdd = this.generations.initialGenomeSize;
      const newGenome = new Genome(
        [...new Array(randomGenesToAdd)].map(() => Genome.generateRandomGene()));
      this.brain = new CreatureBrain(this, newGenome);
    }
    else {
      // genome from parent
      this.brain = new CreatureBrain(this, genome);
    }
    this._genus = CreatureGenus.getGenus(this.brain); 
    // a random phase, so that creatures with the same stamina do not think in the same steps.
    // Drawn only with stamina below 1, so runs without the Stamina action repeat as before
    if (this.brain.stamina < 1) this.thinkCharge = random();
    
    //this._worldWater = this.generations.worldController.worldWater;
    this._mass = new CreatureMass(this, firstGeneration);
    this._attack = new CreatureAttack(this);
    this.reproduction = new CreatureReproduction(this);
    // a species of its own; newCreature() and restoreCreature() set the lineage of a child
    const lineage = speciesOfChild(this.brain.genome.genes, undefined);
    this.speciesId = lineage.speciesId;
    this.speciesParentId = lineage.speciesParentId;
  }

  get genus(): Genus {
    return this._genus;
  }
  get preyGenus(): Genus | undefined {
    if (this._genus === "attack_animal") return "attack_plant";
    if (this._genus === "attack_plant") return "plant";
    return undefined;    
  }

  get predatorGenus(): Genus | undefined {
    if (this._genus === "plant") return "attack_plant";
    if (this._genus === "attack_plant") return "attack_animal";
    return undefined;    
  }

  // the genome and the genus do not change after birth, the colour mode can: the colour is
  // computed again only when the mode changes (the canvas asks for it on every redraw)
  private _color: string | null = null;
  private _colorMode: PhenoTypeColorMode | null = null;

  getColor(): string {
    const mode = this.generations.phenotypeColorMode;
    if (this._color === null || this._colorMode !== mode) {
      this._color = CreaturePhenothype.getColor(mode, this._genus, this.brain);
      this._colorMode = mode;
    }
    return this._color;
  }

  // in generational runs creatures are replaced before they get this old
  get maxAge(): number {
    return this.generations.isContinuous
      ? this.generations.maxAge
      : this.generations.worldController.stepsPerGen + 1;
  }

  computeStep(): void {
    
    if (!this.isAlive) return;

    if (this._age > this.maxAge) {
      this.die("old");
      return;
    }
    this._age++;

    // the brain runs in a share of the steps equal to the stamina
    let thinks = true;
    const stamina = this.brain.stamina;
    if (stamina < 1) {
      this.thinkCharge += stamina;
      if (this.thinkCharge >= 1) this.thinkCharge -= 1;
      else thinks = false;
    }

    this._mass.basalMetabolism(thinks);
    if (!this.isAlive) {
      this.die("basalConsumption");
      return;
    }

    // read sensors and activate actions that will update urgeToMove and call other creature functions.
    // In the steps it does not think, the creature keeps the urge to move of its last thought
    // (inertia) and does no other action
    if (thinks) {
      // reused: nothing else keeps a reference to it
      this.urgeToMove[0] = 0;
      this.urgeToMove[1] = 0;
      this.brain.step();
      this.thinkCount++;
    }

    // Calculate probability of movement
    const moveX = Math.tanh(this.urgeToMove[0]);
    const moveY = Math.tanh(this.urgeToMove[1]);
    const probX = probabilityToBool(Math.abs(moveX)) ? 1 : 0;
    const probY = probabilityToBool(Math.abs(moveY)) ? 1 : 0;

    this.lastPosition[0] = this.position[0];
    this.lastPosition[1] = this.position[1];

    // Move
    if (probX !== 0 || probY !== 0) {
      if (!this.move((moveX < 0 ? -1 : 1) * probX, (moveY < 0 ? -1 : 1) * probY)) {
        // blocked, or not enough mass: MoveForward must not keep pushing into a wall
        this.lastMovement[0] = 0;
        this.lastMovement[1] = 0;
      }
    }

    this.computeDistanceIndex();

    this.lastDirection = this.stepDirection;

    //this.log("mass: ".concat(this._mass.toFixed(1)));


} 


//TODO actionInputValue ha de ser per modificar la massa que passem al fill
  reproduce(actionInputValue: number) {
    // without enough mass it is not a try: nothing is consumed
    if (!this.reproduction.hasEnoughtMassToReproduce) return;
    this.reproduction.reproduce(actionInputValue);
  }

  //TODO actionInputValue es sempre 1?
  attack(actionInputValue: number, targetDirection: Direction4) {
    this.attackCount++;
    const preyMass = this._attack.attack(actionInputValue, targetDirection);
    // the attack has already moved the prey's mass to this creature
    if (preyMass > 0) {
      this.killCount++;
    }
  }

  // MoveToPrey: an urge to move towards the closest prey found at the start of the thought, as
  // strong as the output on each axis. Next to it (N, E, S or W) it can attack, so no urge; in a
  // diagonal neighbour cell it moves on one axis only, to a free cell, horizontally if it can
  moveToPrey(actionInputValue: number) {
    const prey = this.brain.sensedPrey;
    if (!prey) return;
    const [x, y] = this.position;
    const dx = Math.sign(prey.position[0] - x);
    const dy = Math.sign(prey.position[1] - y);
    if (prey.distance === 1) {
      if (dx === 0 || dy === 0) return;
      const grid = this.generations.grid;
      if (grid.isTileEmpty(x + dx, y)) this.addUrgeToMove(dx * actionInputValue, 0);
      else if (grid.isTileEmpty(x, y + dy)) this.addUrgeToMove(0, dy * actionInputValue);
      return;
    }
    this.addUrgeToMove(dx * actionInputValue, dy * actionInputValue);
  }

  findPreyDirection(): Direction4 {
    return this._attack.findPreyDirection();
  }

  private computeDistanceIndex(){
      // Increment distance covered
      if (this.lastPosition[0] == this.position[0] && this.lastPosition[1] == this.position[1]) 
      {
        // has not moved
        this.stepsStopped+= 1;
        if (this.stepsStopped > stepsStoppedPenalization) {
          this.distanceCovered-= 1;
          this.distanceCovered = this.distanceCovered < 0 ? 0 : this.distanceCovered;
        }
      }
      else {
        // has moved
        this.stepsStopped = 0;
        // If keeping same direction for some time, increase distance moved
        // the run counter stops at distanceStraightMax: a longer run keeps scoring
        if (this.stepDirection != null && this.lastDirection == this.stepDirection) {
          if (this.distancePartial < distanceStraightMax) this.distancePartial += 1;
          if (this.distancePartial > distanceStraightMin ) {
            this.distanceCovered += 1;
          }
        }
        else {
          // has changed direction 
          this.distancePartial = 0;
        }
    }
  }

  // returns true if the creature moved
  private move(x: number, y: number): boolean {

    // without enough mass it is not a try: nothing is consumed
    if (!this.hasEnoughMassToMove()) {
      return false;
    }
    this._mass.consumeForMove(this.massAtBirth * this.worldControllerData.MOVE_COST_PER_MASS_TRY);
    this._mass.consumeForMove(this.massAtBirth * this.worldControllerData.MOVE_COST_PER_MASS_DO);    
    
    const finalX = this.position[0] + x;
    const finalY = this.position[1] + y;

    // Check if something is blocking the path
    if (
      this.generations.grid.isTileInsideWorld(finalX, finalY) &&
      this.generations.grid.isTileEmpty(finalX, finalY) &&
      (x === 0 ||
        y === 0 ||
        this.generations.grid.isTileEmpty(this.position[0] + x, this.position[1]) ||
        this.generations.grid.isTileEmpty(this.position[0], this.position[1] + y))
    ) {
      // Mark the grid point so that no other creature
      // can translate to this position
      this.generations.grid.cell(finalX,finalY).creature = this;
      // Free the grid point
      this.generations.grid.cell(this.position[0], this.position[1]).creature = null;

      this.position[0] = finalX;
      this.position[1] = finalY;
      this.lastMovement[0] = x;
      this.lastMovement[1] = y;

      if (x==0 && y==0) this.stepDirection = null;
      else if (x==0 && y==1) this.stepDirection = "N";
      else if (x==1 && y==1) this.stepDirection = "NE";
      else if (x==1 && y==0) this.stepDirection = "E";
      else if (x==1 && y==-1) this.stepDirection = "SE";
      else if (x==0 && y==-1) this.stepDirection = "S";
      else if (x==-1 && y==-1) this.stepDirection = "SW";
      else if (x==-1 && y==0) this.stepDirection = "W";
      else if (x==-1 && y==1) this.stepDirection = "NW";
      else console.log("attack_plant error", x, y);
      return true;
    }
    return false;
  }

  // called by Actions
  addUrgeToMove(x: number, y: number) {
    this.urgeToMove[0] = this.urgeToMove[0] + x;
    this.urgeToMove[1] = this.urgeToMove[1] + y;
  }

  // consume 
  hasEnoughMassToMove() : boolean {
    if (!this._mass._metabolismEnabled) {
      return true;
    }
    return this._mass.mass > this.massAtBirth *
      (this.worldControllerData.MOVE_MULTIPLE_MASS_AT_BIRTH + this.worldControllerData.MOVE_COST_PER_MASS_DO);
  }

  get mass(): number {
    return this._mass.mass;
  }

  get massAtBirth(): number {
    return this._mass._massAtBirth;
  }

  set massAtBirth(mass: number) {
    this._mass._massAtBirth = mass;
  }
  
  /** colour code of the genome (not unique: see speciesId) */
  get genomeColorCode(): string {
    return this.brain.genome.getHexColor();
  }
  
//TODO wanted water depends on actionInputValue
 photosynthesis(actionInputValue: number) : void {
    const cell = this.generations.grid.cell(this.position[0], this.position[1]);
    const waterWanted = this.worldControllerData.MASS_WATER_TO_MASS_PER_STEP * actionInputValue; 
    const waterGotFromCell = this._mass.addFromGrid(cell, waterWanted);
    this.waterFromPhotosynthesis += waterGotFromCell;

 }

 killedByAttack(killerSpeciesId: string) {
  this.killedBySpecies = killerSpeciesId;
  this.die("attacked");
 }

  get isAlive() {
    return this._health > 0 && this._mass.isAlive;
  }

  set health(value: number) {
    const result = Math.max(0, Math.min(maxHealth, value));

    if (result <= 0 && result !== this._health) {
      this.die("health");
    }

    this._health = result;
  }

  get health() {
    return this._health;
  }


  //TODO review
  private die (cause: DeathCause = "unknown") {
    // keep the first cause if die() is reached twice
    if (this.deathCause === null) {
      this.deathCause = cause;
      this.deathStep = this.generations.worldController.currentStep;
      this.deathGen = this.generations.worldController.currentGen;
    }
    this._mass.die();
    //console.log(this.id, cause, this._age, this.generations.worldController.currentStep);
    this._health = -1;
    // --> aixo hauria de fer-ho generations...?
    //this.generations.grid.cell(this.position[0], this.position[1]).creature = null;
      
  }
}
