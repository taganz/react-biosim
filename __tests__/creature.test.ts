//import {describe, expect, test} from '@jest/globals';
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import * as constants from "@/simulation/simulationDataDefault"
import Creature from "@/simulation/creature/Creature";
import Generations from "@/simulation/generations/WorldGenerations";
import WorldController from "@/simulation/world/WorldController";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import { SimulationData } from '@/simulation/SimulationData';
import { SIMULATION_DATA_DEFAULT } from '@/simulation/simulationDataDefault';
import Genome from '@/simulation/creature/brain/Genome';
import CreatureGenus from '@/simulation/creature/CreatureGenus';
import WorldWater from '@/simulation/water/WorldWater';
import WorldGenerations from '@/simulation/generations/WorldGenerations';

/* https://jestjs.io/docs/expect  */

describe('creature test', () => {
    let worldController : WorldController;
    let generations : WorldGenerations;
    let simulationData : SimulationData;
    let joeAt00: Creature;
    let grid : Grid;
    let genome : Genome;
    let worldWater : WorldWater;
    
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
    simulationData.worldGenerationsData.mutationProbability = 0;
    simulationData.worldGenerationsData.deletionRatio = 0;
    simulationData.worldGenerationsData.geneInsertionDeletionProbability = 0;
    worldController = new WorldController(simulationData);
    generations = worldController.generations;
    grid = worldController.generations.grid;
    worldWater = worldController.worldWater;
    let genomePlant = new Genome([CreatureGenus.mainGeneForGenus(generations, "plant")]);
    let genomeAttackPlant = new Genome([CreatureGenus.mainGeneForGenus(generations, "attack_plant")]);
    let genomeAttackAnimal = new Genome([CreatureGenus.mainGeneForGenus(generations, "attack_animal")]);
    let joeRandom = worldController.generations.newCreature([1, 0], true);
    let joePlant = worldController.generations.newCreature([1, 0], true, genomePlant);
    let joeAttackPlant = worldController.generations.newCreature([2, 0], true, genomeAttackPlant);
    let joeAttackAnimal = worldController.generations.newCreature([3, 0], true, genomeAttackAnimal);
    
    test('constructor first generation: brain genes length', () => {
      let genesPlantAnd4MoreGenes = CreatureGenus.geneArrayForGenus(worldController.generations, "plant", 5);
      const joeMoveAndMoreGenes = worldController.generations.newCreature([1, 1], true, new Genome(genesPlantAnd4MoreGenes))
      expect(joeMoveAndMoreGenes.brain.genome.genes.length).toBe(5);
    })
    test('constructor first generation: correct genus', () => {
      let genesPlantAnd4MoreGenes = CreatureGenus.geneArrayForGenus(worldController.generations, "plant", 5);
      //console.log("genesPlantAnd4MoreGenes\n\n", genesPlantAnd4MoreGenes);
      const joeMoveAndMoreGenes = worldController.generations.newCreature([1, 1], true, new Genome(genesPlantAnd4MoreGenes))
      expect(joeMoveAndMoreGenes._genus).toBe("plant");
      expect(joeMoveAndMoreGenes.brain.genome.genes.length).toBe(5);
    })
    test('constructor first generation: massAtBirth depends on genus ', () => {
      const genus = joeRandom._genus;
      if (genus === "plant") {
        expect(joeRandom.massAtBirth).toBe(worldController.simData.worldControllerData.MASS_AT_BIRTH_PLANT);
      }
      if (genus === "attack_plant") {
        expect(joeRandom.massAtBirth).toBe(worldController.simData.worldControllerData.MASS_AT_BIRTH_ATTACK_PLANT);
      }
      if (genus === "attack_animal") {
        expect(joeRandom.massAtBirth).toBe(worldController.simData.worldControllerData.MASS_AT_BIRTH_ATTACK_ANIMAL);
      }
    });
    test.skip('step()', () => {
      let genesPlantAnd4MoreGenes = CreatureGenus.geneArrayForGenus(worldController.generations, "plant", 5);
      //console.log("genesPlantAnd4MoreGenes\n\n", genesPlantAnd4MoreGenes);
      const joeMoveAndMoreGenes = worldController.generations.newCreature([1, 1], true, new Genome(genesPlantAnd4MoreGenes))
      joeMoveAndMoreGenes.computeStep();
    })
    test('constructor - at birth moves water from waterInClouds to waterInCreatures ', () => {
      console.log(worldWater);
      console.log(`cloud: ${worldWater.waterInCloud} creatures: ${worldWater.waterInCreatures} grid: ${worldWater.waterInCells}`);
      const joe2 = worldController.generations.newCreature([2,2], true, genomePlant);
      console.log(`cloud: ${worldWater.waterInCloud} creatures: ${worldWater.waterInCreatures} grid: ${worldWater.waterInCells}`);
    });
    test('genus, preyGenus, predatorGenus', () => {
      const joe2 = worldController.generations.newCreature([2,2], true, genomePlant);
      expect(joe2.genus).toBe("plant");
      expect(joe2.preyGenus).toBeUndefined();
      expect(joe2.predatorGenus).toBe("attack_plant");
      const joeAttackPlant = worldController.generations.newCreature([3,3], true, genomeAttackPlant);
      expect(joeAttackPlant.genus).toBe("attack_plant");
      expect(joeAttackPlant.preyGenus).toBe("plant");
      expect(joeAttackPlant.predatorGenus).toBe("attack_animal");
      const joeAttackAnimal = worldController.generations.newCreature([2,2], true, genomeAttackAnimal);
      expect(joeAttackAnimal.genus).toBe("attack_animal");
      expect(joeAttackAnimal.preyGenus).toBe("attack_plant");
      expect(joeAttackAnimal.predatorGenus).toBeUndefined();

    });

    /*
  //TODO depend de si te fotosintesi, si es reprodueix, de les constants.... 
      test.skip('loop 5 steps and print results ', () => {
        for (var s=0; s< 5; s++) {
          joe.computeStep();
          console.log("step: ", s, "mass: ", joe.mass, "position: ", joe.position);
        }
      });
      test('genome', ()=> {
        console.log("genome: ", joe.brain.genome.toHexadecimalString(), " ", joe.brain.genome);
        console.log("genesIndexToConnection 0: ", joe.brain.genome.genesIndexToConnection(0));
        console.log("genesIndexToConnection 1: ", joe.brain.genome.genesIndexToConnection(1));
        console.log("genesIndexToConnection 2: ", joe.brain.genome.genesIndexToConnection(2));
        console.log("genesIndexToConnection 3: ", joe.brain.genome.genesIndexToConnection(3));
      });
      */
}
); 

