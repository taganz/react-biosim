
import CreatureSensors from "@/simulation/creature/brain/CreatureSensors";
import { SensorName } from "@/simulation/creature/brain/CreatureSensors";
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import Creature from "@/simulation/creature/Creature";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { SIMULATION_DATA_DEFAULT } from "@/simulation/simulationDataDefault";
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import Genome from "@/simulation/creature/brain/Genome";
import { Genus } from "@/simulation/creature/CreatureGenus";
import WorldGenerations from "@/simulation/generations/WorldGenerations";


/* https://jestjs.io/docs/expect  */

describe('CreatureSensors - Prey and Predator sensors', () => {
    let simulationData : SimulationData;  
    let worldController : WorldController;
    let generations : WorldGenerations
    let joeAt00: Creature, joeAt11: Creature;
    let grid : Grid;
    let cs : CreatureSensors;
    let genomePlant : Genome;
    let genomeAttackPlant : Genome;
    let genomeAttackAnimal : Genome;
    
    const allSensors : SensorName[] = [
        "HorizontalPosition"    // 0
      , "VerticalPosition"      // 1
      , "Age"                   // 2
      , "Oscillator"            // 3
      , "Random"                // 4
      , "HorizontalSpeed"       // 5
      , "VerticalSpeed"         // 6
      , "HorizontalBorderDistance"  // 7
      , "VerticalBorderDistance"  // 8
      , "BorderDistance"        // 9
      , "TouchNorth"                 // 10
      , "TouchEast"                 // 11
      , "TouchSouth"                 // 12
      , "TouchWest"                 // 13
      , "Pain"                  // 14
      , "PopulationDensity"     // 15
      , "Mass"                  // 16
      , "PreyDistance"          // 17
      , "PreyNorth"             // 18
      , "PreyEast"      // 19
      , "PreySouth"     // 20
      , "PreyWest"      // 21
      , "PredatorDistance" // 22   
      , "PredatorDirection"  // 23
    ];

    beforeEach(() => {
      
      // simulationData default values

      simulationData = SIMULATION_DATA_DEFAULT;
      // no mutation
      simulationData.worldGenerationsData.mutationProbability = 0;
      simulationData.worldGenerationsData.deletionRatio = 0;
      simulationData.worldGenerationsData.geneInsertionDeletionProbability = 0;
      simulationData.worldObjects = [];
      simulationData.worldControllerData.size = 5;
      simulationData.worldGenerationsData.initialPopulation = 3;


      simulationData.worldGenerationsData.enabledSensors = allSensors;
      worldController = new WorldController(simulationData);
      generations = worldController.generations;
      grid = worldController.generations.grid;
      
      genomePlant = new Genome(CreatureGenus.geneArrayForGenus(generations, "plant", 1));
      genomeAttackPlant  = new Genome(CreatureGenus.geneArrayForGenus(generations, "attack_plant", 1));
      genomeAttackAnimal = new Genome(CreatureGenus.geneArrayForGenus(generations, "attack_animal", 1));
  

      //joeAt11 = worldController.generations.newCreature([1, 1], true, genomePlant);
      //let joePlant = worldController.generations.newCreature([1, 0], genomePlant);
      //let joeMove = worldController.generations.newCreature([2, 0], genomeMove);
      //let joeAttack = worldController.generations.newCreature([3, 0], genomeAttack);
      //joeAt00 = worldController.generations.newCreature([0, 0],true, genomePlant);

      //console.log(grid.debugPrintGridCreatures());
      cs = new CreatureSensors();
      });

    afterEach(() => {
    });

    test('sensor preyDistance return closest prey inside radius', () => {
      const enabledSensors : SensorName[] = [
        "PreyDistance"          
      ];
      cs.loadFromList(enabledSensors);
      generations.worldController.simData.constants.DETECT_RADIUS = 5
      let joeAttackPlantAt00 = worldController.generations.newCreature([0, 0], true, genomeAttackPlant);
      let joeAttackAnimalAt11 = worldController.generations.newCreature([1, 1], true, genomeAttackAnimal);
      let joePlantAt22 = worldController.generations.newCreature([2, 2], true, genomePlant);
      let joePlantAt33 = worldController.generations.newCreature([3, 3], true, genomePlant);
      expect(cs.calculateOutputs(joeAttackPlantAt00)).toEqual([2]);  

    });

    test('calculateOutputs() - PreyDistance: finds nearest prey counting chess king steps', () => {

      const simulationData : SimulationData = SIMULATION_DATA_DEFAULT;
      simulationData.worldObjects = [];
      simulationData.worldControllerData.size = 5;
      simulationData.worldGenerationsData.initialPopulation = 3;
      worldController = new WorldController(simulationData);
      grid = worldController.generations.grid;
      joeAt00 = worldController.generations.newCreature([0, 0], true, genomeAttackPlant);
      // remove other joes

      const enabledSensors : SensorName[] = [
         "PreyDistance"                
        ];
      cs.loadFromList(enabledSensors);

      const ann = worldController.generations.newCreature([1, 3], true, genomePlant);
      const bob = worldController.generations.newCreature([1, 4], true, genomePlant);      
      //console.log(cs.calculateOutputs(joe).toString());
      expect(cs.calculateOutputs(joeAt00)).toEqual([3]);  // ann
    });
    test('sensor preyDistance outside radius returns distance 999999', () => {
      const enabledSensors : SensorName[] = [
        "PreyDistance"          
      ];
      cs.loadFromList(enabledSensors);
      generations.worldController.simData.constants.DETECT_RADIUS = 1;
      let joeAattackPlantAt00 = worldController.generations.newCreature([0, 0], true, genomeAttackPlant);
      let joePlantAt22 = worldController.generations.newCreature([2, 2], true, genomePlant);
      expect(cs.calculateOutputs(joeAattackPlantAt00)).toEqual([999999]);  
     });
  test('sensor preyDirection - creature at SE inside radius', () => {
    const enabledSensors : SensorName[] = [
      "PreyNorth",
      "PreyEast",
      "PreySouth",
      "PreyWest"
    ];
    cs.loadFromList(enabledSensors);
    generations.worldController.simData.constants.DETECT_RADIUS = 5;
    let joeAattackPlantAt00 = worldController.generations.newCreature([0, 0], true, genomeAttackPlant);
    let joePlantAt22 = worldController.generations.newCreature([2, 2], true, genomePlant);
    expect(cs.calculateOutputs(joeAattackPlantAt00)).toEqual([0, 1, 1, 0]);  
  });
  test('sensor preyDirection - creature outside radius return 0,0,0,0', () => {
    const enabledSensors : SensorName[] = [
      "PreyNorth",
      "PreyEast",
      "PreySouth",
      "PreyWest"
    ];
    cs.loadFromList(enabledSensors);
    generations.worldController.simData.constants.DETECT_RADIUS = 1;
    let joeAattackPlantAt00 = worldController.generations.newCreature([0, 0], true, genomeAttackPlant);
    let joePlantAt22 = worldController.generations.newCreature([2, 2], true, genomePlant);
    expect(cs.calculateOutputs(joeAattackPlantAt00)).toEqual([0, 0, 0, 0]);  
  });
  test.skip('sensor predatorDirection', () => {
      expect(1+1).toEqual(3);
  });
  test.skip('sensor predatorDistance', () => {
      expect(1+1).toEqual(3);
  });
  test.skip('log target prey for debug', () => {
      expect(1+1).toEqual(3);
  });
  test.skip('log target predator for debug', () => {
      expect(1+1).toEqual(3);
  });
  
})


