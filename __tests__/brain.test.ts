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
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';


/* https://jestjs.io/docs/expect  */

describe('species edition consoles', () => {

    const worldControllerData = {
        // initial values
        size: 5, 
        stepsPerGen: 10,
        initialPopulation: 1,
        worldObjects : [],

        // user values
        pauseBetweenSteps: 0,
        immediateSteps: 1,
        pauseBetweenGenerations: 0,
        
        // state values
        currentGen: 0,
        currentStep: 0,
        lastGenerationDuration: 0,
        totalTime: 0
    };
    const worldGenerationsData : WorldGenerationsData = {
        populationStrategy: new AsexualZonePopulation,
        selectionMethod: new ReproductionSelection,
        initialPopulation: worldControllerData.initialPopulation,
        initialGenomeSize: 4,
        maxGenomeSize: 10,
        maxNumberNeurons: 3,
        mutationMode: MutationMode.wholeGene,
        mutationProbability: 0.05,
        deletionRatio: 0.5,
        geneInsertionDeletionProbability: 0.015,
        enabledSensors: [
                "HorizontalPosition",
                "VerticalPosition",
                "Age",
                "Oscillator",
                "Random",
                "HorizontalSpeed",
                "VerticalSpeed",
                "HorizontalBorderDistance",
                "VerticalBorderDistance",
                "BorderDistance",
                "Mass"
              ],
        enabledActions: [
                "MoveNorth",
                "MoveSouth",
                "MoveEast",
                "MoveWest",
                "RandomMove",
                "MoveForward",
                "Photosynthesis",
                "Reproduction"
              ],
        // state values 
        lastCreatureIdCreated: 0,
        lastCreatureCount: 0,
        lastSurvivorsCount: 0,
        lastFitnessMaxValue: 0,
        lastSurvivalRate: 0,
        useMetabolism: false, //TODO afegit 20/4 revisar
    };
    const worldController = new WorldController(worldControllerData, worldGenerationsData);
    const generations = new Generations(worldController, worldGenerationsData, worldController.grid);
    const joe = new Creature(generations, [10, 10]);
    const arrayOfGene = [...new Array(4)].map(() => Genome.generateRandomGene());
    const genome = new Genome(arrayOfGene);

    test.skip ('show brain', ()=> {
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

    test("TOOL TO SHOW NETWORK FOR A GENOME", ()=> {
      const genes = [-2071543808,-2071486464]
      const genome = new Genome(genes);
      const brain = new CreatureBrain(joe, genome);
      expect(brain.genome.genes[0]).toEqual(genes[0]);
      console.log(brain.genome);
      console.log(brain.brain);
    });

});

