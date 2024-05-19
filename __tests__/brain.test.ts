//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationDataDefault"
import CreatureBrain from "@/simulation/creature/brain/CreatureBrain";
import Genome from "@/simulation/creature/brain/Genome";
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import Creature from "@/simulation/creature/Creature";
import Generations from "@/simulation/generations/WorldGenerations";
import WorldController from "@/simulation/world/WorldController";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import WorldControllerData from '@/simulation/world/WorldControllerData';
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import { testWorldControllerData } from "./testWorldControllerData";
import { testWorldGenerationsData } from "./testWorldGenerationsData";

/* https://jestjs.io/docs/expect  */

describe('brain basic tests', () => {

    const worldControllerData : WorldControllerData =  testWorldControllerData;
    const worldGenerationsData : WorldGenerationsData = testWorldGenerationsData;
    const worldController = new WorldController(worldControllerData, worldGenerationsData);
    const generations = new Generations(worldController, worldGenerationsData, worldController.grid);
    const grid = new Grid(worldControllerData.size, []); 
    generations.grid = grid;
    const joe = new Creature(generations, [10, 10]);
    const arrayOfGene = [...new Array(4)].map(() => Genome.generateRandomGene());
    const plantGenes = [-2071543808,-2071486464]
    // el genoma son gens que es poden descomposar en 
      // sourceType, sourceId, sinkType, sinkId, weigth
      const genome = new Genome(arrayOfGene);

    test('DISPLAY BRAIN INFORMATION', ()=> {
      const plantGenome = new Genome(plantGenes);
      const joeBrain = new CreatureBrain ( joe, plantGenome);
      console.log("=====================================");
      console.log("brain: ", joeBrain.brain);
      console.log("brain.genome: ", joeBrain.genome);
      console.log("brain.actions: ", joeBrain.actions);
      console.log("brain.sensors: ", joeBrain.sensors);
      console.log("brain.neurons: ", joeBrain.brain.neurons);
      console.log("brain.neuronAccumulators: ", joeBrain.brain.neuronAccumulators);
      console.log("brain.connections.sinkId: ", joeBrain.brain.connections.map(connection => connection.sinkId));
    }); 

    
    test("load brain with Oscil.lator--(2)-->RandomMove network", ()=> {
      console.log("3333333333333333333333333333333333333333333");
      const geneData = [ 1, 3, 1, 4, 2 ];  
      const gene : number = Genome.encodeGeneData(geneData);
      console.log ("geneData: ", geneData, " gene: ", gene);
      const genome = new Genome([gene]);
      const brain = new CreatureBrain(joe, genome);
      expect(brain.genome.genes[0]).toEqual(gene);
      console.log(brain.brain);
    });

    test("TOOL TO SHOW NETWORK FOR A GENOME", ()=> {
      console.log("4444444444444444444444444444444444444444");
      const genes = [-2071543808,-2071486464]
      const genome = new Genome(genes);
      const brain = new CreatureBrain(joe, genome);
      expect(brain.genome.genes[0]).toEqual(genes[0]);
      console.log(brain.genome);
      console.log(brain.brain);
    });
    test("DISPLAY create brain with metabolism enabled", ()=> {
      console.log("55555555555555555555555555555555555555555");
      const worldGenerationsData2 = {...worldGenerationsData, metabolismEnabled: true};
      const generationsWithMetabolism = new Generations(worldController, worldGenerationsData2, worldController.grid);
      worldController.grid.cell(1,1).creature = null;
      worldController.grid.cell(1,1).isSolid = false;
      const joeWithMeta = new Creature(generationsWithMetabolism, [1, 1]);
      console.log("joeWithMeta.brain.genome: ", joeWithMeta.brain.genome);
      const offspringWithMeta = generationsWithMetabolism.newCreature([1, 1], joeWithMeta.brain.genome);
      console.log("offspringWithMeta.brain.genome: ", offspringWithMeta.brain.genome);
      

    });
});

