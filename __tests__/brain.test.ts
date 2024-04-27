//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationConstants"
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

describe('brain tests', () => {

    const worldControllerData : WorldControllerData =  testWorldControllerData;
    const worldGenerationsData : WorldGenerationsData = testWorldGenerationsData;
    const worldController = new WorldController(worldControllerData, worldGenerationsData);
    const generations = new Generations(worldController, worldGenerationsData, worldController.grid);
    const joe = new Creature(generations, [10, 10]);
    const arrayOfGene = [...new Array(4)].map(() => Genome.generateRandomGene());
    const genome = new Genome(arrayOfGene);

    test.skip('show brain', ()=> {
      console.log("arrayOfGene: ", arrayOfGene);
      console.log("genome: ", genome);
      const xx = genome.getGeneData(0);
      console.log("gene 0: ", genome.genes[0], "geneData: ", genome.getGeneData(0));
      //console.log("encoded gene0 data ", genome.encodeGeneData(xx))
      console.log("brain: ", joe.brain.brain);
      console.log("brain.neurons: ", joe.brain.brain.neurons);
      console.log("brain.neuronAccumulators: ", joe.brain.brain.neuronAccumulators);
    }); 

    
    test.skip("load brain with Oscil.lator--(2)-->RandomMove network", ()=> {
      const geneData = [ 1, 3, 1, 4, 2 ];  
      const gene : number = Genome.encodeGeneData(geneData);
      console.log ("geneData: ", geneData, " gene: ", gene);
      const genome = new Genome([gene]);
      const brain = new CreatureBrain(joe, genome);
      expect(brain.genome.genes[0]).toEqual(gene);
      console.log(brain.brain);
    });

    test.skip("TOOL TO SHOW NETWORK FOR A GENOME", ()=> {
      const genes = [-2071543808,-2071486464]
      const genome = new Genome(genes);
      const brain = new CreatureBrain(joe, genome);
      expect(brain.genome.genes[0]).toEqual(genes[0]);
      console.log(brain.genome);
      console.log(brain.brain);
    });
    test("DISPLAY create brain with metabolism enabled", ()=> {
      const worldGenerationsData2 = {...worldGenerationsData, metabolismEnabled: true};
      const generationsWithMetabolism = new Generations(worldController, worldGenerationsData2, worldController.grid);
      worldController.grid.cell(1,1).creature = null;
      worldController.grid.cell(1,1).isSolid = false;
      const joeWithMeta = new Creature(generationsWithMetabolism, [1, 1]);
      console.log("joeWithMeta.brain.genome: ", joeWithMeta.brain.genome);
      const offspringWithMeta = generationsWithMetabolism.newCreature([1, 1], 1, joeWithMeta.brain.genome);
      console.log("offspringWithMeta.brain.genome: ", offspringWithMeta.brain.genome);
      

    });
});

