// WORKING FILE


//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationConstants"
import PopulationStrategy from "@/simulation/generations/population/PopulationStrategy";
import RandomFixedGenePopulation from "@/simulation/generations/population/RandomFixedGenePopulation";
import { populationStrategyFormatter } from "@/simulation/generations/population/PopulationStrategyFormatter";
import CreatureBrain from "@/simulation/creature/brain/CreatureBrain";
import Genome from "@/simulation/creature/brain/Genome";
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import Creature from "@/simulation/creature/Creature";
import Generations from "@/simulation/generations/WorldGenerations";
import WorldController from "@/simulation/world/WorldController";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';



export type SavedPopulationStrategy = string;

/* https://jestjs.io/docs/expect  */

describe('populationStrategy', () => {

        const worldControllerData = {
                // initial values
                size: 5, 
                stepsPerGen: 10,
                initialPopulation: 5,
                worldObjects : [],
                gridPointWaterDefault: 1,

                // user values
                pauseBetweenSteps: 0,
                immediateSteps: 1,
                pauseBetweenGenerations: 0,
                
                // state values
                simCode: "xxx",
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
        metabolismEnabled: false,
        phenotypeColorMode: "genome",
        // state values 
        lastCreatureIdCreated: 0,
        lastCreatureCount: 0,
        lastSurvivorsCount: 0,
        lastFitnessMaxValue: 0,
        lastSurvivalRate: 0,
        };
        const worldController = new WorldController(worldControllerData, worldGenerationsData);
        const generations = new Generations(worldController, worldGenerationsData, worldController.grid);
        const joe = new Creature(generations, [3, 3]);
        const arrayOfGene = [...new Array(4)].map(() => Genome.generateRandomGene());
        const genome = new Genome(arrayOfGene);


        test.skip('populationStrategyFormatter serialize ', () => {
                const arp = new AsexualRandomPopulation();
                const azp = new AsexualZonePopulation();
                const rfgp = new RandomFixedGenePopulation();
                expect(populationStrategyFormatter.serialize(arp)).toEqual("AsexualRandomPopulation");
        });
        test.skip('populationStrategyFormatter deserialize ', () => {
                const arp = new AsexualRandomPopulation();
                const azp = new AsexualZonePopulation();
                const rfgp = new RandomFixedGenePopulation();
                expect(populationStrategyFormatter.deserialize("AsexualRandomPopulation")).toEqual(arp);
                expect(populationStrategyFormatter.deserialize("AsexualZonePopulation")).toEqual(azp);
                expect(populationStrategyFormatter.deserialize("AsexualZonePopulation")).not.toEqual(arp);
        });
        test.skip('AsexualZonePopulation 1st generation without zone', ()=> {
                const arp = new AsexualRandomPopulation();
                arp.populate(worldController.generations);
                worldController.generations.grid.debugPrint();
        });

});




