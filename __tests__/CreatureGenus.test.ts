
import CreatureActions from "@/simulation/creature/brain/CreatureActions";
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import * as constants from "@/simulation/simulationDataDefault"
import Creature from "@/simulation/creature/Creature";
import WorldGenerations from "@/simulation/generations/WorldGenerations";
import WorldController from "@/simulation/world/WorldController";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import { SimulationData } from '@/simulation/SimulationData';
import { SIMULATION_DATA_DEFAULT } from '@/simulation/simulationDataDefault';
import Genome from '@/simulation/creature/brain/Genome';
import CreatureGenus from '@/simulation/creature/CreatureGenus';
import CreatureSensors from "@/simulation/creature/brain/CreatureSensors";
import { Gene, geneToString } from "@/simulation/creature/brain/Genome";
import { Genus } from "@/simulation/creature/CreatureGenus";

/* https://jestjs.io/docs/expect  */

describe('CreatureGenus', () => {
    
    let worldController : WorldController;
    let generations: WorldGenerations;
    let simulationData : SimulationData;
    let joeAt00: Creature;
    let grid : Grid;
    let genome : Genome;
    /*

          SOME PROBABILISTIC TEST HERE

    */
    let TEST_LOOPS = 50;
    //console.warn("doing some probabilistic tests... TEST_LOOPS=", TEST_LOOPS.toString());
    
    simulationData = SIMULATION_DATA_DEFAULT;
    simulationData.worldGenerationsData.enabledActions = [
      "MoveNorth",        // 0
      "MoveSouth",        // 1
      "MoveEast",         // 2
      "MoveWest",         // 3
      "RandomMove",       // 4
      "MoveForward",      // 5
      "Photosynthesis",   // 6 
      "Reproduction",     // 7
      "AttackPlant",      // 8
      "AttackAnimal",     // 9
    ],
    simulationData.worldGenerationsData.enabledSensors = [
      "HorizontalPosition",       // 0
      "VerticalPosition",         // 1
      "Age",                      // 2
      "Oscillator",               // 3
      "Random",                   // 4
      "HorizontalSpeed",          // 5
      "VerticalSpeed",            // 6
      "HorizontalBorderDistance", // 7
      "VerticalBorderDistance",   // 8
      "BorderDistance",           // 9
      "TouchNorth",                    // 10
      "TouchEast",                    // 11
      "TouchSouth",                    // 12
      "TouchWest",                    // 13
      "Pain",                     // 14
      "PopulationDensity",        // 15
      "Mass"                     // 16
      
    ],
    simulationData.worldGenerationsData.mutationProbability = 0;
    simulationData.worldGenerationsData.deletionRatio = 0;
    simulationData.worldGenerationsData.geneInsertionDeletionProbability = 0;
    worldController = new WorldController(simulationData);
    generations = worldController.generations;
    grid = worldController.generations.grid;
    let genomePlant = new Genome([CreatureGenus.randomGeneForGenus(generations, "plant")]);
    let genomeMove = new Genome([CreatureGenus.randomGeneForGenus(generations, "attack_plant")]);
    let genomeAnimal = new Genome([CreatureGenus.randomGeneForGenus(generations, "attack_animal")]);
    let joePlant = worldController.generations.newCreature([1, 0], true, genomePlant);


    //let longGeneArray : Gene[] = CreatureGenus.geneArrayForGenus(worldController.generations, "plant", 10);
    //console.log("longGeneArray:\n\n ", longGeneArray);
    //console.log("to connection:\n\n ",longGeneArray.map( (gene) => {Genome.geneToConnection(gene, generations).toString()}));
    //let joePlant = worldController.generations.newCreature([0, 0], new Genome(longGeneArray));

    beforeEach(() => {
        
      });

    afterEach(() => {
    });

    // DISPLAY geneToString
    //console.log("gene\n", geneToString(generations, gene), "\ngenus\n", genus);

    test.skip('DISPLAY Genus', () => {
      const genome : Genome = new Genome(CreatureGenus.geneArrayForGenus(generations, "attack_animal", 20));
      console.log("genome: \n", genome.toString(generations));
    });
    test('randomGeneForGenus(plant) returns plant gene  ', () => {
      for (let i=0; i<TEST_LOOPS;i++) {
        const gene : Gene = CreatureGenus.randomGeneForGenus(generations, "plant");
        //console.log("plant -- gene:\n", geneToString(generations, gene));
        const genus : Genus = CreatureGenus.getGenusFromGene(generations, gene);
        expect(["unknown", "plant"]).toContain(genus);
      }
    });
    test('randomGeneForGenus(attack_plant) returns unknown or attack_plant gene ', () => {
      for (let i=0; i<TEST_LOOPS;i++) {
        const gene = CreatureGenus.randomGeneForGenus(generations, "attack_plant");
        //console.log("attack_plant -- gene:\n", geneToString(generations, gene));
        const genus = CreatureGenus.getGenusFromGene(generations, gene);
        expect(["unknown", "attack_plant" ]).toContain(genus);
      }
    });
    test('randomGeneForGenus(attack_animal) returns unknown, attack_animal gene ', () => {
      for (let i=0; i<TEST_LOOPS;i++) {
        const gene = CreatureGenus.randomGeneForGenus(generations, "attack_animal");
        //console.log("attack_animal -- gene:\n", geneToString(generations, gene));
        const genus = CreatureGenus.getGenusFromGene(generations, gene);
        expect(["unknown","attack_animal"]).toContain(genus);
      }
    });

    
    test('geneArrayForGenus - get correct genus from a long random plant genome (10 genes)', () => {
      let longGeneArray : Gene[] = CreatureGenus.geneArrayForGenus(worldController.generations, "plant", 10);
      const longGenome = new Genome(longGeneArray);
      //console.log("longGenome: \n\n", longGenome.toString(generations));
      let joePlant = worldController.generations.newCreature([0, 0], true, longGenome);
      //console.log("CreatureGenus.getGenus(joePlant.brain): ", CreatureGenus.getGenus(joePlant.brain));
      expect(CreatureGenus.getGenus(joePlant.brain)).toEqual("plant");
    });
    test('geneArrayForGenus - get correct genus from a long random attack_plant genome (10 genes)', () => {
      let longGeneArray : Gene[] = CreatureGenus.geneArrayForGenus(worldController.generations, "attack_plant", 10);
      const longGenome = new Genome(longGeneArray);
      //console.log("longGenome: \nb", longGenome.toString(generations));
      let joePlant = worldController.generations.newCreature([0, 0], true, longGenome);
      //console.log("CreatureGenus.getGenus(joePlant.brain): ", CreatureGenus.getGenus(joePlant.brain));
      expect(CreatureGenus.getGenus(joePlant.brain)).toEqual("attack_plant");
    });
    test('geneArrayForGenus - get correct genus from a long random attack_animal genome (10 genes)', () => {
      let longGeneArray : Gene[] = CreatureGenus.geneArrayForGenus(worldController.generations, "attack_animal", 10);
      const longGenome = new Genome(longGeneArray);
      //console.log("longGenome: \nb", longGenome.toString(generations));
      let joePlant = worldController.generations.newCreature([0, 0], true, longGenome);
      //console.log("CreatureGenus.getGenus(joePlant.brain): ", CreatureGenus.getGenus(joePlant.brain));
      expect(CreatureGenus.getGenus(joePlant.brain)).toEqual("attack_animal");
    });

})


