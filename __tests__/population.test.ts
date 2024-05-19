// WORKING FILE


//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationDataDefault"
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
import { testWorldControllerData } from "./testWorldControllerData";
import { testWorldGenerationsData } from "./testWorldGenerationsData";
import ContinuousPopulation from "@/simulation/generations/population/ContinuousPopulation";

export type SavedPopulationStrategy = string;

/* https://jestjs.io/docs/expect  */

describe('populationStrategy', () => {

        
        //const worldControllerData = testWorldControllerData;
        //const worldGenerationsData = testWorldGenerationsData
        //const worldController = new WorldController(testWorldControllerData, testWorldGenerationsData);
        //const generations = new Generations(worldController, worldGenerationsData, worldController.grid);
        //const joe = new Creature(generations, [3, 3]);
        //const arrayOfGene = [...new Array(4)].map(() => Genome.generateRandomGene());
        //const genome = new Genome(arrayOfGene);
        

        test('populationStrategyFormatter serialize all strategies ', () => {
                const arp = new AsexualRandomPopulation();
                const azp = new AsexualZonePopulation();
                const rfgp = new RandomFixedGenePopulation();
                const cpp = new ContinuousPopulation();
                expect(populationStrategyFormatter.serialize(arp)).toEqual("AsexualRandomPopulation");
                expect(populationStrategyFormatter.serialize(azp)).toEqual("AsexualZonePopulation");
                expect(populationStrategyFormatter.serialize(rfgp)).toEqual("RandomFixedGenePopulation");
                expect(populationStrategyFormatter.serialize(cpp)).toEqual("ContinuousPopulation");
        });
        test('populationStrategyFormatter deserialize all strategiess', () => {
                const arp = new AsexualRandomPopulation();
                const azp = new AsexualZonePopulation();
                const rfgp = new RandomFixedGenePopulation();
                const cpp = new ContinuousPopulation();
                expect(populationStrategyFormatter.deserialize("AsexualRandomPopulation")).toEqual(arp);
                expect(populationStrategyFormatter.deserialize("AsexualZonePopulation")).toEqual(azp);
                expect(populationStrategyFormatter.deserialize("AsexualZonePopulation")).not.toEqual(arp);
                expect(populationStrategyFormatter.deserialize("RandomFixedGenePopulation")).toEqual(rfgp);
                expect(populationStrategyFormatter.deserialize("ContinuousPopulation")).toEqual(cpp);
                        });
        test('AsexualZonePopulation 1st generation without zone', ()=> {
                const worldController = new WorldController(testWorldControllerData, testWorldGenerationsData);
                const arp = new AsexualRandomPopulation();
                arp.populate(worldController.generations);
                worldController.generations.grid.debugPrintGridCreatures();
        });

});




