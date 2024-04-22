//import {describe, expect, test} from '@jest/globals';
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import * as constants from "@/simulation/simulationConstants"
import Creature from "@/simulation/creature/Creature";
import Generations from "@/simulation/generations/WorldGenerations";
import WorldController from "@/simulation/world/WorldController";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';


/* https://jestjs.io/docs/expect  */

describe('creature test', () => {
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
                      /*
                        "HorizontalSpeed",
                        "VerticalSpeed",
                      */
                        "HorizontalBorderDistance",
                        "VerticalBorderDistance",
                        "BorderDistance",
                        "Mass"
                      ],
                enabledActions: [
                        /*
                            "MoveNorth",
                            "MoveSouth",
                            "MoveEast",
                            "MoveWest",
                            "RandomMove",
                            "MoveForward",
                          */
                            "Photosynthesis",
                            "Reproduction"
                          ],
                // state values 
                lastCreatureIdCreated: 0,
                lastCreatureCount: 0,
                lastSurvivorsCount: 0,
                lastFitnessMaxValue: 0,
                lastSurvivalRate: 0,
                metabolismEnabled: false    //TODO afegit 20/4/24 - revisar
            };
        const worldController = new WorldController(worldControllerData, worldGenerationsData);
        const generations = new Generations(worldController, worldGenerationsData, worldController.grid);
        const joe = new Creature(generations, [10, 10]);
        test('create ', () => {
                expect(joe.mass).toBe(1);
        })
        //TODO depend de si te fotosintesi, si es reprodueix, de les constants.... 
        test.skip('loop 5 steps and print results ', () => {
          for (var s=0; s< 5; s++) {
            joe.computeStep();
            console.log("step: ", s, "mass: ", joe.mass, "position: ", joe.position);
          }
        });
        test('genome', ()=> {
          console.log("genome: ", joe.genome.toHexadecimalString(), " ", joe.brain.genome);
          console.log("getGeneData 0: ", joe.brain.genome.getGeneData(0));
          console.log("getGeneData 1: ", joe.brain.genome.getGeneData(1));
          console.log("getGeneData 2: ", joe.brain.genome.getGeneData(2));
          console.log("getGeneData 3: ", joe.brain.genome.getGeneData(3));
        });

  }
); 

