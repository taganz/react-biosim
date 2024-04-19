import WorldGenerations from "../world/WorldGenerations";
import Genome from "./genome/Genome";
import { probabilityToBool } from "../helpers/helpers";


import * as constants from "../simulationConstants"
import {GridPosition } from "../world/grid/Grid";
import CreatureMass from "./CreatureMass";
import CreatureReproduction from "./CreaturerReproduction";
import CreatureBrain from "./brain/CreatureBrain";


export const maxHealth = 100;

const distanceStraightMin = 35;   // <--- ajustar, passar a parametres de la simulacio?
const distanceStraightMax = 120;   // <--- ajustar, passar a parametres de la simulacio?  - treure?
const stepsStoppedPenalization = 100;

  
type direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"| null;

export default class Creature {
  generations: WorldGenerations;

  id : number;
  stepBirth : number;  
  
  // Position
  position: GridPosition;
  lastPosition: GridPosition;
  urgeToMove: [number, number];
  lastMovement: [number, number];

 
  // Activity
  distancePartial : number = 0;
  distanceCovered : number = 0;
  stepsStopped : number = 0;
  lastDirection : direction = null;
  stepDirection : direction = null;

  // body and brain
  mass : CreatureMass;
  reproduction : CreatureReproduction;
  brain : CreatureBrain;
  
  private _health: number = maxHealth;

  constructor(generations: WorldGenerations, position: GridPosition, massAtBirth?: number, genome?: Genome) {
    this.generations = generations;

    this.id = generations.lastCreatureIdCreated;
    this.stepBirth = generations.currentStep;
    
    // Position
    this.position = position;
    this.lastPosition = [position[0], position[1]];
    this.urgeToMove = [0, 0];
    this.lastMovement = [0, 0];

    this.brain = new CreatureBrain(this, genome);
  
    this.mass = new CreatureMass(this.brain.genome.genes.length, massAtBirth);
    this.reproduction = new CreatureReproduction(this);

  }

  getColor(): string {
    return this.brain.genome.getColor();
  }



  computeStep(): void {
    
    if (!this.isAlive) return;

    this.mass.step();
    if (!this.isAlive) return;

    this.urgeToMove = [0, 0];

    // read sensors and activate actions that will update urgeToMove and call other creature functions
    this.brain.step();

    
    // Calculate probability of movement
    const moveX = Math.tanh(this.urgeToMove[0]);
    const moveY = Math.tanh(this.urgeToMove[1]);
    const probX = probabilityToBool(Math.abs(moveX)) ? 1 : 0;
    const probY = probabilityToBool(Math.abs(moveY)) ? 1 : 0;

    this.lastPosition[0] = this.position[0];
    this.lastPosition[1] = this.position[1];

    // Move
    if (probX !== 0 || probY !== 0) {
      this.move((moveX < 0 ? -1 : 1) * probX, (moveY < 0 ? -1 : 1) * probY);
    }

    this.computeDistanceIndex();

    this.lastDirection = this.stepDirection;

    //this.log("mass: ".concat(this.mass.mass.toFixed(1)));


} 


//TODO actionInputValue ha de ser per modificar la massa que passem al fill
  reproduce(actionInputValue: number) {
    if (this.reproduction.reproduce(actionInputValue)) {
      //this.log("Creature - reproduction!");
    } else {
      //this.log("Creature - can not reproduce!");
    }
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
      if (this.stepDirection != null && this.lastDirection == this.stepDirection  && this.distancePartial < distanceStraightMax) {
        this.distancePartial += 1;
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

  private move(x: number, y: number) {
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
      else console.log("move error", x, y);
      
    }
  }

  addUrgeToMove(x: number, y: number) {
    this.urgeToMove[0] = this.urgeToMove[0] + x;
    this.urgeToMove[1] = this.urgeToMove[1] + y;
  }

  get isAlive() {
    return this._health > 0 && this.mass.isAlive;
  }

  set health(value: number) {
    const result = Math.max(0, Math.min(maxHealth, value));

    if (result <= 0 && result !== this._health) {
      // Free grid point
      //this.generations.grid[this.position[0]][this.position[1]].creature = null;
      this.die();
      // console.log("free!!!")
    }

    this._health = result;
  }

  get health() {
    return this._health;
  }


  log(msg: string, msg2? : any, msg3? : any, msg4? : any) {
    if (!msg2) msg2 = "";
    if (!msg3) msg3 = "";
    if (!msg4) msg4 = "";
    
    if (constants.DEBUG_CREATURE_ID == -1) {
      return;
    }
    if (constants.DEBUG_CREATURE_ID == 0 
      || constants.DEBUG_CREATURE_ID == this.id 
      || (constants.DEBUG_CREATURE_ID == -10 && this.id > 0 && this.id < 10)
      || (constants.DEBUG_CREATURE_ID == -30 && this.id > 0 && this.id < 30)
      )  {
      const genStepString = this.generations.currentGen.toString().concat(".", this.generations.currentStep.toString());
      console.log(genStepString, " #", this.id, ": ", msg, msg2, msg3, msg4);
    }
  }

  //TODO review
  private die () {
    this.log("die");
    this._health = -1;
    // --> aixo hauria de fer-ho generations...?
    this.generations.grid.cell(this.position[0], this.position[1]).creature = null;
      
  }
}
