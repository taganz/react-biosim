// WORKING FILE


//import {describe, expect, test} from '@jest/globals';
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import RandomFixedGenePopulation from "@/simulation/generations/population/RandomFixedGenePopulation";
import { populationStrategyFormatter } from "@/simulation/generations/population/populationStrategyFormatter";
import {Grid} from '../simulation/world/grid/Grid';
import WorldController from "@/simulation/world/WorldController";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import { SimulationData } from "@/simulation/SimulationData";
import PlantHerbivorePopulation from "@/simulation/generations/population/PlantHerbivorePopulation";
import WorldGenerations from "@/simulation/generations/WorldGenerations";

export type SavedPopulationStrategy = string;

/* https://jestjs.io/docs/expect  */

describe('populationStrategy', () => {

        let simulationData : SimulationData = TEST_SIMULATION_DATA;
        simulationData.worldGenerationsData.initialPopulation = 5;
        simulationData.worldControllerData.size = 5;
        
        let worldController : WorldController;
        let generations : WorldGenerations;
        let grid : Grid;
        
        //const worldControllerData = testWorldControllerData;
        //const worldGenerationsData = testWorldGenerationsData
        //const worldController = new WorldController(testWorldControllerData, testWorldGenerationsData);
        //const generations = new Generations(worldController, worldGenerationsData, worldController.grid);
        //const joe = new Creature(generations, [3, 3]);
        //const arrayOfGene = [...new Array(4)].map(() => Genome.generateRandomGene());
        //const genome = new Genome(arrayOfGene);
        
        beforeEach(() => {
                worldController = new WorldController(simulationData);
                generations = worldController.generations;
                grid = worldController.grid;

        });
        test('populationStrategyFormatter serialize all strategies ', () => {
                const arp = new AsexualRandomPopulation();
                const azp = new AsexualZonePopulation();
                const rfgp = new RandomFixedGenePopulation();
                const php = new PlantHerbivorePopulation();
                expect(populationStrategyFormatter.serialize(arp)).toEqual("AsexualRandomPopulation");
                expect(populationStrategyFormatter.serialize(azp)).toEqual("AsexualZonePopulation");
                expect(populationStrategyFormatter.serialize(rfgp)).toEqual("RandomFixedGenePopulation");
                expect(populationStrategyFormatter.serialize(php)).toEqual("PlantHerbivorePopulation");
        });
        test('populationStrategyFormatter deserialize all strategiess', () => {
                const arp = new AsexualRandomPopulation();
                const azp = new AsexualZonePopulation();
                const rfgp = new RandomFixedGenePopulation();
                const php = new PlantHerbivorePopulation();
                expect(populationStrategyFormatter.deserialize("AsexualRandomPopulation")).toEqual(arp);
                expect(populationStrategyFormatter.deserialize("AsexualZonePopulation")).toEqual(azp);
                expect(populationStrategyFormatter.deserialize("RandomFixedGenePopulation")).toEqual(rfgp);
                expect(populationStrategyFormatter.deserialize("PlantHerbivorePopulation")).toEqual(php);
        });
        test('AsexualZonePopulation(): 1st generation without zone', ()=> {
                const arp = new AsexualZonePopulation();
                arp.populate(generations);
                console.log("AsexualZonePopulation(): 1st generation without zone");
                console.log(grid.creatureCount(), " creatures in grid");
                grid.debugPrintGridCreatures();
                grid.debugPrintCreatures(generations);
        });
        test('AsexualRandomPopulation()', ()=> {
                const arp = new AsexualRandomPopulation();
                arp.populate(generations);
                console.log("AsexualRandomPopulation()");
                console.log(grid.creatureCount(), " creatures in grid");
                grid.debugPrintGridCreatures();
                grid.debugPrintCreatures(generations);
        });
        test('PlantHerbivorePopulation()', ()=> {
                const arp = new PlantHerbivorePopulation();
                arp.populate(generations);
                console.log("PlantHerbivorePopulation()");
                console.log(grid.creatureCount(), " creatures in grid");
                grid.debugPrintGridCreatures();
                grid.debugPrintCreatures(generations);
        });
        test('RandomFixedGenePopulation()', ()=> {
                const arp = new RandomFixedGenePopulation();
                arp.populate(generations);
                console.log("RandomFixedGenePopulation()");
                console.log(grid.creatureCount(), " creatures in grid");
                grid.debugPrintGridCreatures();
                grid.debugPrintCreatures(generations);
        });
});




