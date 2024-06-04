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
import { SimulationData } from "@/simulation/SimulationData";
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import { Gene } from "@/simulation/creature/brain/Genome";

/* https://jestjs.io/docs/expect  */

describe('brain basic tests', () => {

    
    const simulationData : SimulationData = constants.SIMULATION_DATA_DEFAULT;
    const worldController = new WorldController(simulationData);
    const generations = worldController.generations;
    let genomePlant = new Genome(CreatureGenus.geneArrayForGenus(generations, "plant", 1));
    let genomeMove = new Genome(CreatureGenus.geneArrayForGenus(generations, "attack_plant", 1));
    let genomeAttack = new Genome(CreatureGenus.geneArrayForGenus(generations, "attack_animal", 1));
    //const grid = worldController.generations.grid; 
    const joe = generations.newCreature([10, 10], true, genomePlant);

    test('constructor - load one gene', ()=> {
      expect(joe.brain.genome.genes).toEqual(genomePlant.genes)
    });

    test('DISPLAY BRAIN INFORMATION', ()=> {
      const joeBrain = joe.brain;
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
      console.log("load brain with Oscil.lator--(2)-->RandomMove network\n");
      const connection = {
        sourceType: 1,
        sourceId: 3,
        sinkType: 1,
        sinkId:  4,
        weight: 2 
    };
      const gene : Gene = Genome.connectionToGene(connection);
      console.log ("connection: ", connection, " gene: ", gene);
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

    /*
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
    */
});

