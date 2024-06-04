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

describe('CreatureSensors - not including prey sensors, ...', () => {
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
      
      genomePlant = new Genome([CreatureGenus.randomGeneForGenus(generations, "plant")]);
      genomeAttackPlant  = new Genome([CreatureGenus.randomGeneForGenus(generations, "attack_plant")]);
      genomeAttackAnimal = new Genome([CreatureGenus.randomGeneForGenus(generations, "attack_animal")]);
  

      joeAt11 = worldController.generations.newCreature([1, 1], true, genomePlant);
      //let joePlant = worldController.generations.newCreature([1, 0], genomePlant);
      //let joeMove = worldController.generations.newCreature([2, 0], genomeMove);
      //let joeAttack = worldController.generations.newCreature([3, 0], genomeAttack);

      joeAt00 = worldController.generations.newCreature([0, 0],true, genomePlant);

      //console.log(grid.debugPrintGridCreatures());
      cs = new CreatureSensors();
      });

    afterEach(() => {
    });

    test('loadFromList(): update sensors enabled status', () => {
      const enabledSensors : SensorName[] = [
           "Random"          
         , "TouchNorth"         
        ];
      cs.loadFromList(enabledSensors);
      expect(cs.data.Age.enabled).toBe(false);
      expect(cs.data.Random.enabled).toBe(true);
      expect(cs.data.TouchNorth.enabled).toBe(true);
    });
    test('loadFromList(): neuronsCount sums neurons for enabled sensors - All sensor neuronCount should be 1 now!', () => {
      const enabledSensors : SensorName[] = [
         "Random"                
         , "TouchNorth"                 
        ];
      cs.loadFromList(enabledSensors);
      expect(cs.neuronsCount).toBe(cs.enabledSensors.length);   
    });
    test('getList(): return list of enabled sensors', () => {
      const enabledSensors : SensorName[] = [
         "Random"                
         , "TouchNorth"                 
        ];
      cs.loadFromList(enabledSensors);
      expect(cs.enabledSensors).toEqual(enabledSensors);
    });
    test('getGenusMain - always null for genus --- TOBE DEPRECATED', () => {
      const enabledSensors : SensorName[] = [
         "Mass"                  // 16
        , "PreyDistance"          // 17
           ];
      cs.loadFromList(enabledSensors);
      expect(cs.getGenusMain(0)).toBeNull();
      expect(cs.getGenusMain(1)).toBeNull();;
    });
    test('sensorsByCompatibleGenus ', () => {
      const enabledSensors : SensorName[] = [
         "Mass"                  // 16
        , "PreyDistance"          // 17
           ];
      cs.loadFromList(enabledSensors);
      expect(cs.sensorsByCompatibleGenus(0)).toStrictEqual(["plant", "attack_plant", "attack_animal"]);
      expect(cs.sensorsByCompatibleGenus(1)).toStrictEqual( ["attack_plant", "attack_animal"]);
    });
    test('sensorsByMainGenus(): DEPRECATED  //TODO', () => {
      expect(cs.sensorsByMainGenus("plant")).toStrictEqual([]);
      expect(cs.sensorsByMainGenus("attack_plant")).toStrictEqual([]);
      expect(cs.sensorsByMainGenus("attack_animal")).toStrictEqual([]);
    });
    
    test('calculateOutputs(): return a list of values with lenght = neuronCount if creature not at borders', () => {
      const twoSensors : SensorName[] = [
           "Random"                
         , "TouchNorth"                
        ];
      simulationData.worldGenerationsData.enabledSensors = twoSensors;
      const worldController2 = new WorldController(simulationData);
      let joePlant = worldController2.generations.newCreature([1, 1], true, genomePlant);
      //console.log('calculateOutputs(): return a list of values with lenght = neuronCount\n\n', cs.calculateOutputs(joeAt11).toString());
      expect(joePlant.brain.sensors.calculateOutputs(joePlant).length).toEqual(joePlant.brain.sensors.neuronsCount);
    });
    test('calculateOutputs() - Age: return current step / stepsPerGenerations', () => {
      const enabledSensors : SensorName[] = [
         "Age"                
        ];
      cs.loadFromList(enabledSensors);
      //console.log(cs.calculateOutputs(joe).toString());
      expect(cs.calculateOutputs(joeAt11)[0]).toBeCloseTo(worldController.currentStep / worldController.stepsPerGen, 4);
    });
    test('calculateOutputs() - TouchNorth: return 0 values if creature at 0,0', () => {
      const enabledSensors : SensorName[] = [
         "TouchNorth"                
        ];
      cs.loadFromList(enabledSensors);
      expect(cs.calculateOutputs(joeAt00).length).toBe(0);
    });
    test('calculateOutputs() - TouchNorth: return 1 values if creature not at borders', () => {
      const enabledSensors : SensorName[] = [
         "TouchNorth"                
        ];
      cs.loadFromList(enabledSensors);
      expect(cs.calculateOutputs(joeAt11).length).toBe(1);
    });
    test('PreyDistance: loads sensor', () => {
      const enabledSensors : SensorName[] = [
         "PreyDistance"                
        ];
      cs.loadFromList(enabledSensors);
      expect(cs.data.PreyDistance.enabled).toBe(true);
      expect(cs.neuronsCount).toEqual(1);
    });

    /*
    test('calculateOutputs() - PreyDistance: finds nearest prey counting chess king steps', () => {

      const simulationData : SimulationData = SIMULATION_DATA_DEFAULT;
      simulationData.worldObjects = [];
      simulationData.worldControllerData.size = 5;
      simulationData.worldGenerationsData.initialPopulation = 3;
      worldController = new WorldController(simulationData);
      grid = worldController.generations.grid;
      joeAt00 = worldController.generations.newCreature([0, 0], true);
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
    */
    test ('sensorNameToId()', () => {
      const enabledSensors : SensorName[] = [
          "Random"          
        , "TouchNorth"         
      ];
      cs.loadFromList(enabledSensors);
      expect(cs.sensorNameToId("Random")).toBe(0);
      expect(cs.sensorNameToId("TouchNorth")).toBe(1);
    });
    test ('enabledSensorsForGenus()', () => {
      const enabledSensors : SensorName[] = [
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
      cs.loadFromList(enabledSensors);
      //console.log("cs.enabledSensorsForFamily()\n\n", cs.enabledSensorsForFamily("attack"));
      expect(cs.enabledSensorsForGenus("plant")).toEqual(
        [
          "HorizontalPosition"    // 0
          , "VerticalPosition"      // 1
          , "Age"                   // 2
          , "Oscillator"            // 3
          , "Random"                // 4
    //      , "HorizontalSpeed"       // 5
    //      , "VerticalSpeed"         // 6
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

        ]
      );
      expect(cs.enabledSensorsForGenus("attack_animal")).toEqual( 
        [
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
      //    , "PredatorDistance"      // 19
      //    , "PredatorDirection"     // 20
         ]);
        expect(cs.enabledSensorsForGenus("attack_plant")).toEqual( 
          [
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
            , "PredatorDistance"      // 19
            , "PredatorDirection"     // 20
           ]);  
    });


/*
    test('loadFromList 2 actions and return correct getList', () => {
        const enabledActions = [
               "Photosynthesis",   // 6 
               "Reproduction",     // 7
             ];
        ca.loadFromList(enabledActions);
        expect(ca.getList()).toStrictEqual(enabledActions);
    });
    test('getFamilies ', () => {
        const enabledActions = [
               "MoveNorth",   
               "Reproduction",     
             ];
        ca.loadFromList(enabledActions);
        expect(ca.sensorsByCompatibleGenus(0)).toBe("attack_plant");
        expect(ca.sensorsByCompatibleGenus(1)).toBe("basic");
    });
    test('getFamilies throw error if invalid index ', () => {
        expect(() => {
            const enabledActions = [
                "MoveNorth",   
                "Reproduction",     
              ];
             ca.loadFromList(enabledActions);
             ca.sensorsByCompatibleGenus(2);
            }).toThrow();
    });
    */
   

  
})


