import CreatureActions from "../creature/actions/CreatureActions";
import Creature from "../creature/Creature";
import { MutationMode } from "../creature/genome/MutationMode";
//import AsexualZonePopulation from "../creature/population/AsexualZonePopulation";
import PopulationStrategy from "../creature/population/PopulationStrategy";
//import InsideReproductionAreaSelection from "../creature/selection/InsideReproductionAreaSelection";
import SelectionMethod from "../creature/selection/SelectionMethod";
import CreatureSensors from "../creature/sensors/CreatureSensors";
import {Grid, GridCell, GridPosition} from "./grid/Grid"
import Genome from "@/simulation/creature/genome/Genome";
import worldInitialValues from "./WorldInitialValues";


export default class WorldGenerations {
  
  grid: Grid;
  currentCreatures: Creature[] = [];
  
  initialPopulation: number = 0;
  initialGenomeSize: number = 0;
  maxGenomeSize: number = 0;
  maxNumberNeurons: number = 0;
  mutationProbability: number = 0;
  geneInsertionDeletionProbability: number = 0;
  sensors: CreatureSensors = new CreatureSensors();
  actions: CreatureActions = new CreatureActions();
  lastCreatureIdCreated : number = 0;   // --> aprofitar posicio en array per id de creatures?

  lastGenerationSurvivors : Creature[] = [];

  
  // need this for creature logging
  currentStep : number = 0;
  currentGen : number = 0;
  stepsPerGen : number = 0;

  // Stats for GenerationRegistry
  lastCreatureCount: number = 0;
  lastSurvivorsCount: number = 0;
  lastFitnessMaxValue : number = 0;
  //lastSurvivalRate: number = 0;
  //lastGenerationDate: Date = new Date();
  //lastGenerationDuration: number = 0;
  //lastPauseDate: Date | undefined = new Date();
  //pauseTime: number = 0;
  //totalTime: number = 0;
  populationStrategy:   PopulationStrategy; 
  selectionMethod: SelectionMethod;  
  mutationMode : MutationMode;
  deletionRatio : number;
    
  // get initial values
  constructor(worldInitialValues: worldInitialValues, grid: Grid) {
        
    // grid
    this.grid = grid;
    this.stepsPerGen = worldInitialValues.stepsPerGen; 
    
    // population & selection
    this.populationStrategy = worldInitialValues.populationStrategy;;
    this.initialPopulation = worldInitialValues.initialPopulation;
        
    //TODO should take into account objects size
    if (this.initialPopulation >= this.grid.size * this.grid.size) {
      throw new Error(
        "The population cannot be greater than the number of available tiles in the worldController: ".concat(this.initialPopulation.toString(), " vs ", (this.grid.size * this.grid.size).toString())
      );
    }
    this.selectionMethod = worldInitialValues.selectionMethod;
    
    // Neural networks
    this.initialGenomeSize = worldInitialValues.initialGenomeSize;
    this.maxGenomeSize = worldInitialValues.maxGenomeSize;
    this.maxNumberNeurons = worldInitialValues.maxNumberNeurons;
    
    // Mutations
    this.mutationMode = worldInitialValues.mutationMode;
    this.mutationProbability = worldInitialValues.mutationProbability;
    this.geneInsertionDeletionProbability = worldInitialValues.geneInsertionDeletionProbability;
    this.deletionRatio = 0.5;

    // creatures 
    this.sensors.loadFromList(worldInitialValues.enabledSensors);
    this.actions.loadFromList(worldInitialValues.enabledActions);
    //this.sensors.updateInternalValues();
    //this.actions.updateInternalValues();
    

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
    for (let i = 0; i < this.currentCreatures.length; i++) {
      const creature = this.currentCreatures[i];
      if (creature.isAlive) {
        // Effect of the areas the creature is in
        const point = this.grid.cell(creature.position[0], creature.position[1]);
        for (
          let objectIndex = 0;
          objectIndex < point.objects.length;
          objectIndex++
        ) {
          point.objects[objectIndex].areaEffectOnCreature?.(creature);
          creaturesStillLive++;
        }

        creature.computeStep();
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


  
  // Repopulate with survivors
  this.populationStrategy.populate(this, survivors);
  this.lastSurvivorsCount = survivors.length;
  //this.lastSurvivalRate = this.lastSurvivorsCount / this.lastCreatureCount;
  this.lastFitnessMaxValue = fitnessMaxValue;


  this.lastGenerationSurvivors = survivors;

}

//public startGeneration(): void {};


get isFirstGeneration() {
return this.currentGen == 0;
}

}
