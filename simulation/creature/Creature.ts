import WorldGenerations from "../generations/WorldGenerations";
import Genome from "./brain/Genome";
import { probabilityToBool } from "../helpers/helpers";
import {GridPosition } from "../world/grid/Grid";
import CreatureMass from "./CreatureMass";
import CreatureAttack from "./CreatureAttack";
import CreatureReproduction from "./CreaturerReproduction";
import CreatureBrain from "./brain/CreatureBrain";
import EventLogger, {SimulationCallEvent} from '@/simulation/logger/EventLogger';
import {LogEvent, LogLevel} from '@/simulation/logger/LogEvent';
import {Direction, Direction4} from '@/simulation/world/direction';
import CreaturePhenothype from "./CreaturePhenothype";
import CreatureGenus, {Genus} from "./CreatureGenus";
import WorldWater from "../water/WorldWater";
import WorldControllerData from "../world/WorldControllerData";

export const maxHealth = 100;

const distanceStraightMin = 35;   // <--- ajustar, passar a parametres de la simulacio?
const distanceStraightMax = 120;   // <--- ajustar, passar a parametres de la simulacio?  - treure?
const stepsStoppedPenalization = 100;

  

export default class Creature {
  generations: WorldGenerations;
  eventLogger: EventLogger;
  worldControllerData : WorldControllerData;

  id : number;
  stepBirth : number;  
  massAtBirth : number;
  
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
  _worldWater : WorldWater;
  
  private _health: number = maxHealth;

  // firstGeneration creatures get mass from waterInCloud
  // firstGeneration creatures can receive a genome to spawn a specific genus
  constructor(generations: WorldGenerations, position: GridPosition, firstGeneration: boolean, genome?: Genome) {
    
    this.generations = generations;
    this.worldControllerData = generations.worldController.simData.worldControllerData;

    this.id = generations.lastCreatureIdCreated + 1;
    this.stepBirth = generations.worldController.currentStep;
    
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

    //TODO hauria d'estar en CreatureMass
    switch(this._genus)   {
      case "plant":
      case "unknown":
        this.massAtBirth = this.worldControllerData.MASS_AT_BIRTH_PLANT;
        break;
      case "attack_plant":
        this.massAtBirth = this.worldControllerData.MASS_AT_BIRTH_ATTACK_PLANT;
        break;
      case "attack_animal":
        this.massAtBirth = this.worldControllerData.MASS_AT_BIRTH_ATTACK_ANIMAL;
        break;
      default:
        console.error("genus unknown ", this._genus);
        this.massAtBirth = 1;
    }
    
    this._worldWater = this.generations.worldController.worldWater;
    if (firstGeneration) {
          // if first generation, water should be obtained from cloud
          this._worldWater.getWaterFromCloud(this.massAtBirth);
    }
    this._mass = new CreatureMass(this);
    this._attack = new CreatureAttack(this);
    this.reproduction = new CreatureReproduction(this);
    this.eventLogger = generations.worldController.eventLogger;
    this.logBasicData("birth");
  }



  getColor(): string {
    return CreaturePhenothype.getColor(this.generations.phenotypeColorMode, this._genus, this.brain);
  }

  // generations need to reset this for continuous population
  resetAge() {
    this._age = 0;
    this.stepBirth = 0;
  }

  computeStep(): void {
    
    if (!this.isAlive) return;

    if (this._age > this.generations.worldController.stepsPerGen + 1) {
      this.die("old");
      return;
    }
    this._age++;

    const basalMetabolismConsumed = this._mass.basalMetabolism();
    this._worldWater.dissipateWater(basalMetabolismConsumed);         //TODO la relacio amb WorldWater hauria d'estar directament en CreatureMass
    this.log(LogEvent.METABOLISM, "mass", this.mass);
    this.log(LogEvent.METABOLISM, "basalConsumption", basalMetabolismConsumed);
    if (!this.isAlive) {
      this.die("basalConsumption");
      return;
    }

    // read sensors and activate actions that will update urgeToMove and call other creature functions
    this.urgeToMove = [0, 0];
    const energyConsumedByActionsExecution = this.brain.step();
    const consumed = this._mass.consume(energyConsumedByActionsExecution);
    this._worldWater.dissipateWater(consumed);
    this.log(LogEvent.METABOLISM, "actionsExecutionConsumption", consumed);
    if (!this.isAlive) {
      this.die("actionsExecutionConsumption");
      return;
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
      this.attack_plant((moveX < 0 ? -1 : 1) * probX, (moveY < 0 ? -1 : 1) * probY);
      this.log(LogEvent.MOVE, "position x + 100y",  this.position[0]+this.position[1]*100);
    }

    this.computeDistanceIndex();

    this.lastDirection = this.stepDirection;

    //this.log("mass: ".concat(this._mass.toFixed(1)));


} 


//TODO actionInputValue ha de ser per modificar la massa que passem al fill
  reproduce(actionInputValue: number) {
    this.log(LogEvent.REPRODUCE_TRY, "mass", this.mass);
    if (this.reproduction.reproduce(actionInputValue)) {
      this.log(LogEvent.REPRODUCE, "actionInputValue", actionInputValue);
      this.log(LogEvent.REPRODUCE, "mass", this.mass);
    } else {
        //TODO ??
    }
  }

  //TODO actionInputValue es sempre 1?
  attack(actionInputValue: number, targetDirection: Direction4) {
    this.log(LogEvent.ATTACK_TRY, "actionInputValue", Math.round(actionInputValue*100)/100);
    this.log(LogEvent.ATTACK_TRY, "targetDirection", 0, 0, <string>targetDirection);
    const preyMass = this._attack.attack(actionInputValue, targetDirection);
    if (preyMass > 0) {
      this._mass.add(preyMass);
      this.log(LogEvent.ATTACK, "preyMass", preyMass);
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

  private attack_plant(x: number, y: number) {


    this.log(LogEvent.MOVE_TRY, "x,y", Math.round(x), Math.round(y));
    const consumed = this._mass.consume(this.massAtBirth * this.worldControllerData.MOVE_COST_PER_MASS_TRY);    
    this._worldWater.dissipateWater(consumed);
    if (!this.hasEnoughMassToMove()) {
      return false;
    }
    const consumedDo = this._mass.consume(this.massAtBirth * this.worldControllerData.MOVE_COST_PER_MASS_DO);    
    this._worldWater.dissipateWater(consumedDo);
    
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
      this.log(LogEvent.MOVE, "direction", Math.round(x), Math.round(y), <string>this.stepDirection);

    }
  }

  // called by Actions
  addUrgeToMove(x: number, y: number) {
    this.urgeToMove[0] = this.urgeToMove[0] + x;
    this.urgeToMove[1] = this.urgeToMove[1] + y;
  }

  // consume 
  private hasEnoughMassToMove() : boolean {
    if (!this._mass._metabolismEnabled) {
      return true;
    }
    return this._mass.mass > this.massAtBirth *
      (this.worldControllerData.MOVE_MULTIPLE_MASS_AT_BIRTH + this.worldControllerData.MOVE_COST_PER_MASS_DO);
  }

  get mass(): number {
    return this._mass.mass;
  }
  
  get specie(): string {
    return this.brain.genome.getHexColor();
  }
  
//TODO wanted water depends on actionInputValue
 photosynthesis(actionInputValue: number) : void {
    const cell = this.generations.grid.cell(this.position[0], this.position[1]);
    const waterWanted = this.worldControllerData.MASS_WATER_TO_MASS_PER_STEP * actionInputValue; 
    const waterGotFromCell = this._worldWater.getWaterFromCell(cell, waterWanted);
    this._mass.add(waterGotFromCell);
    this.log(LogEvent.PHOTOSYNTHESIS, "actionInputValue", actionInputValue);
    this.log(LogEvent.PHOTOSYNTHESIS, "waterGotFromCell", waterGotFromCell);

 }

 killedByAttack(killerSpecie: string) {
  this.log(LogEvent.DEAD_ATTACKED, "killerSpecie", Math.round(this.position[0]), Math.round(this.position[1]), killerSpecie);
  this.die("attacked");
 }

  get isAlive() {
    return this._health > 0 && this._mass.isAlive;
  }

  set health(value: number) {
    const result = Math.max(0, Math.min(maxHealth, value));

    if (result <= 0 && result !== this._health) {
      // Free grid point
      //this.generations.grid[this.position[0]][this.position[1]].creature = null;
      this.die("health");
      // console.log("free!!!")
    }

    this._health = result;
  }

  get health() {
    return this._health;
  }


  logBasicData(when: string = "") {
    this.log(LogEvent.INFO, when + " " +"mass", this.mass);
    this.log(LogEvent.INFO, when + " " +"gen", this.generations.worldController.currentGen);
    this.log(LogEvent.INFO, when + " " +"neuronsCount", this.brain.actions.neuronsCount);
    this.log(LogEvent.INFO, when + " " +"_energyConsumedByActionsExecution", this.brain.actions._energyConsumedByActionsExecution);
    this.log(LogEvent.INFO, when + " " +"stepBirth", this.stepBirth);
    this.log(LogEvent.INFO, when + " " +"massAtBirth", this.massAtBirth);
    this.log(LogEvent.INFO, when + " " +"position", this.position[0], this.position[1]);
    this.log(LogEvent.INFO, when + " " +"lastMovement" , this.lastMovement[0], this.lastMovement[1]);
  }

  
  log(eventType: LogEvent, paramName? : string, paramValue? : number, paramValue2? : number, paramString?: string) { 
      if (!this.eventLogger) {
        console.error("this.eventLogger not found");
        return;
      }

      // reduce trivial logs

      const discardStep = this.generations.worldController.currentStep % 10 != 0;
      if (eventType == LogEvent.PHOTOSYNTHESIS && paramName == "actionInputValue" && discardStep) return;
      if (eventType == LogEvent.PHOTOSYNTHESIS && paramName == "waterGotFromCell" && discardStep) return;
      if (eventType == LogEvent.METABOLISM && discardStep) return;
      
      const event : SimulationCallEvent = {
        logLevel: LogLevel.CREATURE,
        creatureId: this.id,
        speciesId: this.specie,
        genusId: this._genus,
        eventType: eventType,
        paramName: paramName ?? "",
        paramValue: paramValue ?? 0,
        paramValue2: paramValue2 ?? 0,
        paramString: paramString ?? ""
      }
      this.eventLogger.logEvent(event);
    }

  //TODO review
  private die (cause: string = "unknown") {
    this._worldWater.returnWaterToCell(
      this.generations.worldController.grid.cell(this.position[0], this.position[1]),
      this.mass
    )
    this.log(LogEvent.DEAD, "cause", undefined, undefined, cause);
    this.logBasicData("dead");
    //console.log(this.id, cause, this._age, this.generations.worldController.currentStep);
    this._health = -1;
    // --> aixo hauria de fer-ho generations...?
    //this.generations.grid.cell(this.position[0], this.position[1]).creature = null;
      
  }
}
