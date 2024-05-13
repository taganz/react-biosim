
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
import WorldControllerData from "@/simulation/world/WorldControllerData";
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import { testWorldControllerData } from "./testWorldControllerData";
import { testWorldGenerationsData } from "./testWorldGenerationsData";
import ContinuousPopulation from "@/simulation/generations/population/ContinuousPopulation";
import WorldWater from "@/simulation/world/WorldWater";

/* https://jestjs.io/docs/expect  */

describe('WorldWater', () => {
    
    test('should store waterInCloud', () => {
        const worldWater = new WorldWater(10);
        const grid = new Grid(5, []);
        expect(worldWater.waterInCloud).toEqual(10);
    });
    test('should keep total water after rain', () => {
        const worldWater = new WorldWater(10);
        const grid = new Grid(5, []);
        worldWater.rain(grid);
        const totalWater = worldWater.waterInCells + worldWater.waterInCloud + worldWater.waterInCreatures;
        expect(totalWater).toEqual(10);
    });
    test('firstRain should throw error if there is not enought water', () => {
        const worldWater = new WorldWater(10);
        const grid = new Grid(5, []);
        expect(() => {worldWater.firstRain(grid, 3)}).toThrow();  // need 3 * 5 * 5 = 75 > 10   
    });
    test('firstRain should send correct amount of water to cells', () => {
        const worldWater = new WorldWater(100);
        const grid = new Grid(5, []);
        worldWater.firstRain(grid, 3.4);    // 3.4 * 5 * 5 = 85
        expect(grid.cell(2,2).water).toEqual(3.4);
        expect(grid.debugGetGridWater()).toBeCloseTo(85, 4);
        expect(worldWater.totalWater).toEqual(100);
        expect(worldWater.waterInCells).toEqual(85);
    });
    test('grid total water should match grid waterInCell', () => {
        const worldWater = new WorldWater(10);
        const grid = new Grid(5, []);
        const waterAtGridInit = grid.debugGetGridWater();
        worldWater.rain(grid);
        expect(grid.debugGetGridWater() - waterAtGridInit).toEqual(worldWater.waterInCells);
    });
    test('should keep total water after evoporation', () => {
        const worldWater = new WorldWater(10);
        const grid = new Grid(5, []);
        worldWater.rain(grid);
        worldWater.evaporation(grid);
        const totalWater = worldWater.waterInCells + worldWater.waterInCloud + worldWater.waterInCreatures;
        expect(totalWater).toEqual(10);
    });
    test('should keep total water after creature operations', () => {
        const worldWater = new WorldWater(10);
        const grid = new Grid(5, []);
        const waterGot = worldWater.getWaterFromCell(grid.cell(1,1), 3);
        worldWater.returnWaterToCell(grid.cell(1,1), waterGot);
        worldWater.evaporation(grid);
        const totalWater = worldWater.waterInCells + worldWater.waterInCloud + worldWater.waterInCreatures;
        expect(totalWater).toEqual(10);
    });

})


