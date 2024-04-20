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


export default class WorldGenerations {
  
  worldController: WorldController;
  grid: Grid;
  currentCreatures: Creature[] = [];
  
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
  sensors: CreatureSensors = new CreatureSensors();
  actions: CreatureActions = new CreatureActions();
  useMetabolism : boolean;
  // state values
  // .. read by creature
  lastCreatureIdCreated : number = 0;   //TODO aprofitar posicio en array per id de creatures?
  // .. read by GenerationRegistry      //TODO passar com a parametre?
  lastCreatureCount: number = 0;      
  lastSurvivorsCount: number = 0;
  lastFitnessMaxValue : number = 0;
  lastSurvivalRate : number = 0;
  


  // internal use
  _lastGenerationSurvivors : Creature[] = [];
  // need this for creature logging
  currentStep : number = 0;
  currentGen : number = 0;

  // if creatures is not null, assume we are loading a saved state
  constructor(worldController: WorldController, worldGenerationsData: worldGenerationsData, grid: Grid, creatures?: Creature[]) {
        
    this.worldController = worldController;
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
    this.sensors.loadFromList(worldGenerationsData.enabledSensors);
    this.actions.loadFromList(worldGenerationsData.enabledActions);
    this.useMetabolism = worldGenerationsData.useMetabolism;
   

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

    this.startFirstGeneration();

  }

  private startFirstGeneration() {
      this.populationStrategy.populate(this);
      this.lastCreatureCount = this.currentCreatures.length;
  }


  // creates a new creature, add to currentCreatures, add to grid, mutate genome
  public newCreature(position : GridPosition, massAtBirth?: number, genome?: Genome) : Creature {
    if (genome) {
      let genomeOffspring = genome.clone(
        true,
        this.mutationMode,
        this.maxGenomeSize,
        this.mutationProbability,
        this.geneInsertionDeletionProbability,
        this.deletionRatio
      )
      var creature = new Creature(this, position, massAtBirth, genomeOffspring);
    }
    else {
      var creature = new Creature(this, position);
    }
    this.grid.addCreature(creature);
    this.currentCreatures.push(creature);
    this.lastCreatureIdCreated += 1;
    return creature;
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

  this.currentStep++;
  return creaturesStillLive;
  
  }


public endGeneration(): void {

  this.currentGen++;

  // Get survivors and calculate maximum fitness for this generation
  const {survivors, fitnessMaxValue} = this.selectionMethod.getSurvivors(this);
  //console.log("generation ", this.currentGen, " step ", this.currentStep, " survivors found: ", survivors.length);

  // Reset creatures
  this.grid.clearCreatures();
  this.currentCreatures = [];
  this.lastCreatureIdCreated = 0;   // resets at generation
  this.currentStep = 0;

  
  // Repopulate with survivors
  this.populationStrategy.populate(this, survivors);
  this.lastSurvivorsCount = survivors.length;
  this.lastSurvivalRate = this.lastSurvivorsCount / this.lastCreatureCount;
  this.lastFitnessMaxValue = fitnessMaxValue;


  this._lastGenerationSurvivors = survivors;

}

//public startGeneration(): void {};


get isFirstGeneration() {
return this.currentGen == 0;
}

}
