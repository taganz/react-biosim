import CreatureActions from "../creature/brain/CreatureActions";
import Creature from "../creature/Creature";
import { MutationMode } from "../creature/brain/MutationMode";
//import AsexualZonePopulation from "../creature/population/AsexualZonePopulation";
import PopulationStrategy from "./population/PopulationStrategy";
//import InsideReproductionAreaSelection from "../creature/selection/InsideReproductionAreaSelection";
import SelectionMethod from "./selection/SelectionMethod";
import CreatureSensors from "../creature/brain/CreatureSensors";
import {Grid, GridCell, GridPosition} from "../world/grid/Grid"
import Genome from "@/simulation/creature/brain/Genome";
import worldGenerationsData from "./WorldGenerationsData";
import WorldController from "../world/WorldController";
import EventLogger, {SimulationCallEvent} from '@/simulation/logger/EventLogger';
import {LogEvent, LogLevel} from '@/simulation/logger/LogEvent';
import {PhenoTypeColorMode} from "@/simulation/creature/PhenoTypeColorMode";
import WorldGenerationsData from "./WorldGenerationsData";
import { SensorName } from "../creature/brain/CreatureSensors";
import { ActionName } from "../creature/brain/CreatureActions";


// doesn't know currentStep nor currentGeneration, uses worldController

export default class WorldGenerations {
  
  worldController: WorldController;
  grid: Grid;
  currentCreatures: Creature[] = [];
  eventLogger : EventLogger;
  worldGenerationsData : WorldGenerationsData;
  
  //TODO following data is repeated in worldGenerationsData

  // initial values
  populationStrategy:   PopulationStrategy; 
  selectionMethod: SelectionMethod;  
  initialPopulation: number = 0;
  initialGenomeSize: number = 0;
  maxGenomeSize: number = 0;
  maxNumberNeurons: number = 0;
  mutationMode : MutationMode; 
  mutationProbability: number = 0;
  deletionRatio : number;
  geneInsertionDeletionProbability: number = 0;
  sensors: CreatureSensors;
  enabledSensors: SensorName[];
  enabledActions: ActionName[];
  actions: CreatureActions;
  metabolismEnabled : boolean;
  phenotypeColorMode : PhenoTypeColorMode;
  // state values
  // .. read by creature
  lastCreatureIdCreated : number = 0;   
  // .. read by GenerationRegistry      //TODO passar com a parametre?
  lastCreatureCount: number = 0;      
  lastSurvivorsCount: number = 0;
  lastFitnessMaxValue : number = 0;
  lastSurvivalRate : number = 0;
  



  // if creatures is not null, assume we are loading a saved state
  constructor(worldController: WorldController, worldGenerationsData: worldGenerationsData, grid: Grid, creatures?: Creature[]) {
        
    this.worldController = worldController;
    this.worldGenerationsData = worldGenerationsData;
    this.grid = grid;
    
    // initial values
    this.populationStrategy = worldGenerationsData.populationStrategy;;
    this.selectionMethod = worldGenerationsData.selectionMethod;
    this.initialPopulation = worldGenerationsData.initialPopulation;
    this.initialGenomeSize = worldGenerationsData.initialGenomeSize;
    this.maxGenomeSize = worldGenerationsData.maxGenomeSize;
    this.maxNumberNeurons = worldGenerationsData.maxNumberNeurons;
    this.mutationMode = worldGenerationsData.mutationMode;
    this.mutationProbability = worldGenerationsData.mutationProbability;
    this.deletionRatio = worldGenerationsData.deletionRatio;
    this.geneInsertionDeletionProbability = worldGenerationsData.geneInsertionDeletionProbability;
    this.sensors = new CreatureSensors();
    this.actions = new CreatureActions (worldController.simData.worldControllerData.MASS_COST_PER_EXECUTE_ACTION,
                  worldController.simData.worldControllerData.ACTION_REPRODUCTION_OFFSET);
    this.sensors.loadFromList(worldGenerationsData.enabledSensors);
    this.actions.loadFromList(worldGenerationsData.enabledActions);
    this.enabledSensors = worldGenerationsData.enabledSensors;
    this.enabledActions = worldGenerationsData.enabledActions;
  
    this.metabolismEnabled = worldGenerationsData.metabolismEnabled;
    this.phenotypeColorMode = worldGenerationsData.phenotypeColorMode;
    this.eventLogger = worldController.eventLogger;

    //TODO should take into account objects size
    if (this.initialPopulation >= this.grid.size * this.grid.size) {
      throw new Error(
        "The population cannot be greater than the number of available tiles in the worldController: ".concat(this.initialPopulation.toString(), " vs ", (this.grid.size * this.grid.size).toString())
      );
    }

    if (!creatures) {
      this.currentCreatures = [];
      // state values
      this.lastCreatureIdCreated = 0;  
      this.lastCreatureCount = 0;
      this.lastSurvivorsCount = 0;
      this.lastFitnessMaxValue = 0;
      this.lastSurvivalRate = 0;
    }
    else {
      this.currentCreatures = [...creatures] ;
      // state values
      this.lastCreatureIdCreated = worldGenerationsData.lastCreatureIdCreated; 
      this.lastCreatureCount = worldGenerationsData.lastCreatureCount;
      this.lastSurvivorsCount = worldGenerationsData.lastSurvivorsCount;
      this.lastFitnessMaxValue = worldGenerationsData.lastFitnessMaxValue;
      this.lastSurvivalRate = worldGenerationsData.lastSurvivalRate;
    }
    //console.log("worldGenerations initialized");
  }

  
  public populate() {
      this.populationStrategy.populate(this);
      this.lastCreatureCount = this.currentCreatures.length;
  }


  // creates a new creature, add to currentCreatures, add to grid, mutate genome
  public newCreature(position : GridPosition, firstGeneration: boolean, genome?: Genome) : Creature {
    if (genome && !firstGeneration) {
      let genomeOffspring = genome.clone(
        true,
        this.mutationMode,
        this.maxGenomeSize,
        this.mutationProbability,
        this.geneInsertionDeletionProbability,
        this.deletionRatio
      )
      var creature = new Creature(this, position, firstGeneration, genomeOffspring);
    }
    else {
      var creature = new Creature(this, position, firstGeneration, genome);
    }
    this.grid.addCreature(creature);
    this.currentCreatures.push(creature);
    this.lastCreatureIdCreated += 1;  
    return creature;
  }

  // copy all creatures without mutations for continuous simulation
  public updateCreatures(creatures: Creature[]) {
    for (let i = 0; i < creatures.length;i++) {
      const creature = creatures[i];
      creature.resetAge();
    }
    this.grid.updateCreatures(creatures);
    this.currentCreatures = [];
    this.currentCreatures = creatures;
  }

  
  

public step(): number {

    let creaturesStillLive = 0;
    for (let i= this.currentCreatures.length -1; i >= 0; i--) {
      const creature = this.currentCreatures[i];
      if (creature.isAlive) {
        creaturesStillLive++;
        /*
        // Effect of the areas the creature is in
        const point = this.grid.cell(creature.position[0], creature.position[1]);
        for (
          let objectIndex = 0;
          objectIndex < point.objects.length;
          objectIndex++
        ) {
          point.objects[objectIndex].areaEffectOnCreature?.(creature);
        }
        */
        creature.computeStep();
      } 
      if (!creature.isAlive) {
        this.grid.removeCreature(creature);
        this.currentCreatures.splice(i, 1);
      }
    }

  return creaturesStillLive;
  
  }


public selectionAndRepopulate(): void {


  // Get survivors and calculate maximum fitness for this generation
  const {survivors, fitnessMaxValue} = this.selectionMethod.getSurvivors(this);

  this.grid.clearCreatures();
  this.currentCreatures = [];
  if (this.selectionMethod.shouldResetLastCreatureIdCreatedEveryGeneration) {
    this.lastCreatureIdCreated = 0;   
  }

  
  // Repopulate with survivors
  this.populationStrategy.populate(this, survivors);

  // update generation stats
  this.lastSurvivorsCount = survivors.length;
  this.lastSurvivalRate = this.lastSurvivorsCount / this.lastCreatureCount;
  this.lastFitnessMaxValue = fitnessMaxValue;



}



get isFirstGeneration() {
  return this.worldController.currentGen == 1;
}
get currentGen() {
  return this.worldController.currentGen;
}

public creatureById(id: number) : Creature {

  for (let i = 0; i< this.currentCreatures.length; i++) {
    if (this.currentCreatures[i].id == id) {
      return this.currentCreatures[i];
    }
  }
  throw new Error ("Creature id not found");
}
private log(eventType: LogEvent, paramName? : string, paramValue? : number , paramValue2? : number, paramString?: string) { 
  if (!this.eventLogger) {
    console.error("this.eventLogger not found");
    return;
  }
  const event : SimulationCallEvent = {
    logLevel: LogLevel.GENERATION,
    creatureId: 0,
    speciesId: "", 
    genusId: "",
    eventType: eventType,
    paramName: paramName ?? "",
    paramValue: paramValue ?? 0,
    paramValue2: paramValue2 ?? 0,
    paramString : paramString ?? ""
  }
  this.eventLogger.logEvent(event);
}

}
