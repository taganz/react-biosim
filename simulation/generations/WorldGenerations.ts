import CreatureActions from "../creature/brain/CreatureActions";
import Creature from "../creature/Creature";
import { MutationMode } from "../creature/brain/MutationMode";
//import AsexualZonePopulation from "../creature/population/AsexualZonePopulation";
import PopulationStrategy from "./population/PopulationStrategy";
//import InsideReproductionAreaSelection from "../creature/selection/InsideReproductionAreaSelection";
import SelectionMethod from "./selection/SelectionMethod";
import CreatureSensors from "../creature/brain/CreatureSensors";
import {Grid, GridPosition} from "../world/grid/Grid"
import Genome, { Gene, StaminaGeneRules } from "@/simulation/creature/brain/Genome";
import { NeuronType } from "@/simulation/creature/brain/Neuron";
import { STAMINA_MISSING_VALUES } from "@/simulation/creature/brain/CreatureBrain";
import { random } from "@/simulation/helpers/random";
import worldGenerationsData from "./WorldGenerationsData";
import WorldController from "../world/WorldController";
import EventLogger, {SimulationCallEvent} from '@/simulation/logger/EventLogger';
import {LogEvent, LogLevel} from '@/simulation/logger/LogEvent';
import {PhenoTypeColorMode} from "@/simulation/creature/PhenoTypeColorMode";
import WorldGenerationsData from "./WorldGenerationsData";
import { SensorName } from "../creature/brain/CreatureSensors";
import { ActionName } from "../creature/brain/CreatureActions";
import { SimulationType } from "./SimulationType";
import { GeneDecoding } from "../creature/brain/geneTranslation";
import { addHerbivoreOldAgeDeath, computeHerbivoreGenomeStats, HerbivoreGenomeStats, HerbivoreOldAgeDeaths } from "./creatureQueries";


// doesn't know currentStep nor currentGeneration, uses worldController

export default class WorldGenerations {
  
  worldController: WorldController;
  grid: Grid;
  currentCreatures: Creature[] = [];
  eventLogger : EventLogger;
  worldGenerationsData : WorldGenerationsData;
  
  //TODO following data is repeated in worldGenerationsData

  // initial values
  simulationType: SimulationType;
  maxAge: number;
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
  // set by selectSurvivors() at the end of a generation, used by selectionAndRepopulate()
  private selection: {survivors: Creature[], fitnessMaxValue : number} | null = null;
  lastSurvivalRate : number = 0;
  // births and deaths during the current generation, and during the last one
  birthsThisGeneration: number = 0;
  deathsThisGeneration: number = 0;
  lastBirths: number = 0;
  lastDeaths: number = 0;
  // herbivores that died of old age during the current generation, and the stats of the last one
  private herbivoreOldAgeDeaths: HerbivoreOldAgeDeaths = new Map();
  lastHerbivoreGenomeStats: HerbivoreGenomeStats | null = null;
  // genomes of the creatures placed at the start of the current generation, for "Save generation"
  startGenomes : Genome[] = [];
  



  // if creatures is not null, assume we are loading a saved state
  constructor(worldController: WorldController, worldGenerationsData: worldGenerationsData, grid: Grid, creatures?: Creature[]) {
        
    this.worldController = worldController;
    this.worldGenerationsData = worldGenerationsData;
    this.grid = grid;
    
    // initial values
    this.simulationType = worldGenerationsData.simulationType;
    this.maxAge = worldGenerationsData.maxAge;
    this.populationStrategy = worldGenerationsData.populationStrategy;
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
    this.actions = new CreatureActions (worldController.simData.worldControllerData.ACTION_ATTACK_OFFSET);
    this.sensors.loadFromList(worldGenerationsData.enabledSensors);
    this.actions.loadFromList(worldGenerationsData.enabledActions);
    // the lists the brain uses: table order, without names that no longer exist (older files)
    this.enabledSensors = this.sensors.enabledSensors;
    this.enabledActions = this.actions.enabledActions;
  
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

  
  get isContinuous(): boolean {
    return this.simulationType === "continuous";
  }

  public populate() {
      this.populationStrategy.populate(this);
      this.lastCreatureCount = this.currentCreatures.length;
      // the initial population are not births
      this.birthsThisGeneration = 0;
      this.recordStartGenomes();
  }

  /**
   * Starts the generation with the given genomes, one creature each, without mutation.
   * They are placed like generation 1: around the spawn area if there is one, otherwise at random.
   */
  public populateWithGenomes(genomes: Genome[]) {
    const spawnArea = this.grid.objects.find((obj) => obj.areaType === 2);
    for (const genome of genomes) {
      let position : GridPosition | null;
      if (spawnArea) {
        const [x, y] = this.grid.clamp((spawnArea.x + spawnArea.width/2) * this.grid.size, (spawnArea.y + spawnArea.height/2) * this.grid.size);
        position = this.grid.getCenteredAvailablePosition(x, y, spawnArea.width/2 * this.grid.size, spawnArea.height/2 * this.grid.size, genomes.length);
      } else {
        position = this.grid.getRandomAvailablePosition();
      }
      if (position != null) {
        this.newCreature(position, true, new Genome(genome.genes.slice()));
      }
      else {
        console.warn("no position for creature");
      }
    }
    this.lastCreatureCount = this.currentCreatures.length;
    // the initial population are not births
    this.birthsThisGeneration = 0;
    this.recordStartGenomes();
  }

  // Without the Stamina action: undefined, and genomes are cloned as before
  public staminaGeneRules(): StaminaGeneRules | undefined {
    if (!this.actions.data.Stamina.enabled) return undefined;
    const staminaId = this.actions.actionNameToId("Stamina");
    const data = this.worldController.simData.worldControllerData;
    // a stamina step is 8 times as big in weight (-4..4 is stamina 0..1)
    const weightStep = 8 * (data.STAMINA_MUTATION_STEP ?? STAMINA_MISSING_VALUES.STAMINA_MUTATION_STEP);
    return {
      isStaminaGene: (gene: Gene) => {
        const connection = Genome.geneToConnection(gene, this);
        return connection.sinkType === NeuronType.ACTION && connection.sinkId === staminaId;
      },
      mutateStaminaGene: (gene: Gene) => {
        const weight = (gene & 65535) / 8192 - 4;
        const newWeight = Math.min(4 - 1 / 8192, Math.max(-4, weight + (random() * 2 - 1) * weightStep));
        return (gene & ~65535) | Math.round((newWeight + 4) * 8192);
      },
    };
  }

  // a Stamina gene with a random stamina between 0 and 1; its source is not used
  private newStaminaGene(): Gene {
    return Genome.connectionToGene({
      sourceType: NeuronType.SENSOR, sourceId: 0,
      sinkType: NeuronType.ACTION, sinkId: this.actions.actionNameToId("Stamina"),
      weight: -4 + 8 * random(),
    });
  }

  // genomes are not changed after birth, so keeping the references is enough
  private recordStartGenomes() {
    this.startGenomes = this.currentCreatures.map((creature) => creature.brain.genome);
  }


  // creates a new creature, add to currentCreatures, add to grid, mutate genome.
  // parent is the creature the genome comes from, recorded for the lineage
  public newCreature(position : GridPosition, firstGeneration: boolean, genome?: Genome, parent?: Creature) : Creature {
    const staminaRules = this.staminaGeneRules();
    if (genome && !firstGeneration) {
      genome = genome.clone(
        true,
        this.mutationMode,
        this.maxGenomeSize,
        this.mutationProbability,
        this.geneInsertionDeletionProbability,
        this.deletionRatio,
        staminaRules
      )
    }
    else if (!genome && staminaRules) {
      // the random genome the creature would make, made here to add the Stamina gene;
      // its genes are drawn again until they are not Stamina genes
      genome = new Genome([...new Array(this.initialGenomeSize)].map(() => {
        let gene = Genome.generateRandomGene();
        while (staminaRules.isStaminaGene(gene)) gene = Genome.generateRandomGene();
        return gene;
      }));
    }
    // with the Stamina action, every new genome has a Stamina gene: older genomes get one
    if (genome && staminaRules && !genome.genes.some(staminaRules.isStaminaGene)) {
      genome = new Genome([...genome.genes, this.newStaminaGene()]);
    }
    const creature = new Creature(this, position, firstGeneration, genome);
    if (parent) {
      creature.parentId = parent.id;
      creature.parentBirthGen = parent.birthGen;
      parent.childrenCount++;
    }
    // 0 when the creature has no parent
    // the genome string is only built when the logger records
    if (!creature.eventLogger?.isPaused) {
      creature.log(LogEvent.BIRTH, "parentId", parent?.id ?? 0, parent?.birthGen ?? 0);
      creature.log(LogEvent.BIRTH, "genome", 0, 0, creature.brain.genome.toHexadecimalString());
    }
    this.grid.addCreature(creature);
    this.currentCreatures.push(creature);
    this.lastCreatureIdCreated += 1;  
    this.birthsThisGeneration++;
    return creature;
  }

  // Recreates a creature of a previous run bound to this generations and grid, keeping its
  // genome, position, mass and counters. Returns null if its cell is outside the world or not empty.
  /** how genes are decoded with these settings (see geneTranslation.ts) */
  get geneDecoding(): GeneDecoding {
    return { sensors: this.sensors.enabledSensors, actions: this.actions.enabledActions, maxNeurons: this.maxNumberNeurons };
  }

  // genes: the genome to give it instead of the source's one (a hot change translates them)
  public restoreCreature(source: Creature, genes?: Gene[]) : Creature | null {
    const [x, y] = source.position;
    if (!this.grid.isTileInsideWorld(x, y) || !this.grid.isTileEmpty(x, y)) {
      return null;
    }
    const creature = new Creature(this, [x, y], false, new Genome(genes ?? source.brain.genome.genes.slice()));
    creature.id = source.id;
    creature.stepBirth = source.stepBirth;
    creature.birthGen = source.birthGen;
    creature.parentId = source.parentId;
    creature.parentBirthGen = source.parentBirthGen;
    creature.childrenCount = source.childrenCount;
    creature.attackCount = source.attackCount;
    creature.killCount = source.killCount;
    creature.waterFromPhotosynthesis = source.waterFromPhotosynthesis;
    creature.waterFromPrey = source.waterFromPrey;
    creature._age = source._age;
    creature.lastPosition = [source.lastPosition[0], source.lastPosition[1]];
    creature.lastMovement = [source.lastMovement[0], source.lastMovement[1]];
    creature.distancePartial = source.distancePartial;
    creature.distanceCovered = source.distanceCovered;
    creature.stepsStopped = source.stepsStopped;
    creature.lastDirection = source.lastDirection;
    creature.massAtBirth = source.massAtBirth;
    creature._mass._mass = source.mass;
    creature._mass.copyTotals(source._mass);
    // the world water is new, so the water in this creature is taken from the cloud
    this.worldController.worldWater.getWaterFromCloud(source.mass);
    this.grid.addCreature(creature);
    this.currentCreatures.push(creature);
    return creature;
  }


  
  

public step(): number {

    let creaturesStillLive = 0;
    // the dead are set to null and taken out after the loop, keeping the order: splicing each
    // one moved the rest of the list. Nothing reads the list during the loop but newCreature,
    // which only pushes at the end, past the creatures the loop visits
    const creatures = this.currentCreatures as (Creature | null)[];
    let firstRemoved = creatures.length;
    for (let i= creatures.length -1; i >= 0; i--) {
      const creature = creatures[i]!;
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
        creatures[i] = null;
        firstRemoved = i;
        this.deathsThisGeneration++;
        if (creature.deathCause === "old" && creature.genus === "attack_plant") {
          addHerbivoreOldAgeDeath(this.herbivoreOldAgeDeaths, creature);
        }
      }
    }

    let kept = firstRemoved;
    for (let i = firstRemoved; i < creatures.length; i++) {
      const creature = creatures[i];
      if (creature !== null) creatures[kept++] = creature;
    }
    creatures.length = kept;

  return creaturesStillLive;
  
  }


// continuous runs: the generation is only a time window, so the creatures carry on
// and only the stats of the window are recorded. The population is the plotted value.
public endTimeWindow(): void {
  this.lastSurvivorsCount = this.currentCreatures.length;
  this.lastSurvivalRate = this.lastCreatureCount > 0 ? this.lastSurvivorsCount / this.lastCreatureCount : 0;
  this.lastFitnessMaxValue = this.currentCreatures.length;
  this.closeBirthAndDeathCounts();
  // the population at the start of the next window
  this.lastCreatureCount = this.currentCreatures.length;
}

// called when the generation ends, while its creatures are still in the world
public closeHerbivoreGenomeStats(): void {
  this.lastHerbivoreGenomeStats = computeHerbivoreGenomeStats(this.currentGen, this.currentCreatures, this.herbivoreOldAgeDeaths);
  this.herbivoreOldAgeDeaths = new Map();
}

private closeBirthAndDeathCounts(): void {
  this.lastBirths = this.birthsThisGeneration;
  this.lastDeaths = this.deathsThisGeneration;
  this.birthsThisGeneration = 0;
  this.deathsThisGeneration = 0;
}

// Get survivors and calculate maximum fitness for this generation; returns the number of survivors
public selectSurvivors(): number {
  this.selection = this.selectionMethod.getSurvivors(this);
  return this.selection.survivors.length;
}

public selectionAndRepopulate(): void {

  const {survivors, fitnessMaxValue} = this.selection ?? this.selectionMethod.getSurvivors(this);
  this.selection = null;

  this.grid.clearCreatures();
  this.currentCreatures = [];
  if (this.selectionMethod.shouldResetLastCreatureIdCreatedEveryGeneration) {
    this.lastCreatureIdCreated = 0;   
  }

  
  this.closeBirthAndDeathCounts();

  // Repopulate with survivors
  this.populationStrategy.populate(this, survivors);
  // the new generation are not births
  this.birthsThisGeneration = 0;
  this.recordStartGenomes();

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
