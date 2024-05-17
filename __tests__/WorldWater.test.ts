
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
import { WaterData } from "@/simulation/world/WorldControllerData";

/* https://jestjs.io/docs/expect  */

describe('WorldWater', () => {
    
    let waterData : WaterData;
    let worldWater : WorldWater;
    let grid : Grid;
    
    beforeEach(() => {
        waterData = constants.WORLD_CONTROLLER_DATA_DEFAULT.waterData;
        waterData.waterRainMaxPerCell = 1.1;
        waterData.waterFirstRainPerCell = 2.1;
        waterData.waterCellCapacity = 4.3;
        waterData.waterTotalPerCell = 2.5;
        waterData.waterEvaporationPerCellPerGeneration = 0.7;
        worldWater = new WorldWater(5, waterData);
        grid = new Grid(5, [], waterData.waterCellCapacity);
      });


    test('should store in waterInCloud size * size * waterFirstRainPerCell', () => {
        expect(worldWater.waterInCloud).toEqual(2.5 * 5 * 5); 
    });
    test('should keep total water after rain', () => {
        worldWater.rain(grid);
        const totalWater = worldWater.waterInCells + worldWater.waterInCloud + worldWater.waterInCreatures;
        expect(totalWater).toBeCloseTo(2.5 * 5 * 5, 4);
    });
    test('rain typeUniform should give max water per cell to grid', () => {
        worldWater.rain(grid, "rainTypeUniform");
        // ojo, dependra de capacitat de les cel.les!!
        grid.debugPrintWater();
        expect(grid.cell(2,2).water).toBe(1.1);

    });
    /*
    test('firstRain should throw error if there is not enought water', () => {
        const worldWater = new WorldWater(10);
        const grid = new Grid(5, []);
        expect(() => {worldWater.firstRain(grid, 3)}).toThrow();  // need 3 * 5 * 5 = 75 > 10   
    });
    */
    test('firstRain with enough water available in cloud', () => {
        worldWater.firstRain(grid);    
        expect(grid.cell(2,2).water).toEqual(2.1);
        expect(grid.debugGetGridWater()).toBeCloseTo(2.1*5*5, 4);
        expect(worldWater.waterInCells).toBeCloseTo(2.1*5*5, 4);
        expect(worldWater.waterInCloud).toBeCloseTo((2.5-2.1)*5*5, 4);
        expect(worldWater.totalWater).toEqual(2.5*5*5);
        
    });
    test('firstRain with not enought capacity in cells caps rain at capacity ', () => {
        waterData.waterFirstRainPerCell = 10;
        waterData.waterTotalPerCell = 100;
        worldWater = new WorldWater(5, waterData);
        worldWater.firstRain(grid);    
        expect(grid.cell(2,2).water).toEqual(4.3);
        expect(grid.debugGetGridWater()).toBeCloseTo(4.3*5*5, 4);
        expect(worldWater.waterInCells).toBeCloseTo(4.3*5*5, 4);
        expect(worldWater.waterInCloud).toBeCloseTo((100-4.3)*5*5, 4);
        expect(worldWater.totalWater).toEqual(100*5*5);
        
    });
    test('grid total water should match grid waterInCell', () => {
        const waterAtGridInit = grid.debugGetGridWater();
        worldWater.rain(grid);
        expect(grid.debugGetGridWater() - waterAtGridInit).toEqual(worldWater.waterInCells);
    });
    test('should keep total water after rain uniform', () => {
        worldWater.rain(grid, "rainTypeUniform", 1.7);
        worldWater.evaporation(grid);
        expect(worldWater.totalWater).toBeCloseTo(2.5*5*5, 4);
    });
    test('should keep total water after rain sinsin', () => {
        worldWater.rain(grid, "rainTypeSinSin", 1.5);
        worldWater.evaporation(grid);
        expect(worldWater.totalWater).toBeCloseTo(2.5*5*5, 4);
    });
    test('should keep total water after evaporation', () => {
        worldWater.rain(grid, "rainTypeUniform", 1);
        worldWater.evaporation(grid);
        expect(worldWater.totalWater).toBeCloseTo(2.5*5*5, 4);
    });
    test('should keep total water after creature operations', () => {
        const waterGot = worldWater.getWaterFromCell(grid.cell(1,1), 3);
        worldWater.returnWaterToCell(grid.cell(1,1), waterGot);
        worldWater.evaporation(grid);
        expect(worldWater.totalWater).toBeCloseTo(2.5*5*5, 4);
    });
    test('creature gets water from cell', () => {
        worldWater.firstRain(grid);  // 2.1
        expect(worldWater.waterInCells).toBeCloseTo(2.1*5*5, 4);
        expect(worldWater.waterInCloud).toBeCloseTo(0.4*5*5, 4);
        const cell0 = grid.cell(0,0);
        const cell1 = grid.cell(1,1);
        worldWater.getWaterFromCell(cell0, 1);
        worldWater.getWaterFromCell(cell1, 3);  // greater than available
        expect(cell0.water).toBe(2.1 - 1);      // get asked 1
        expect(cell1.water).toBe(2.1 - 2.1);    // gets max available 2.1
        expect(worldWater.waterInCells).toBeCloseTo(2.1*5*5 - 3.1, 4);
        expect(worldWater.waterInCreatures).toBeCloseTo(3.1, 4);
    });
    test('creature return water to cell', () => {
        worldWater.firstRain(grid);  // 2.1
        expect(worldWater.waterInCells).toBeCloseTo(2.1*5*5, 4);
        expect(worldWater.waterInCloud).toBeCloseTo(0.4*5*5, 4);
        const cell0 = grid.cell(0,0);
        const cell1 = grid.cell(1,1);

        // gets 2 and return 1

        worldWater.getWaterFromCell(cell0, 2);
        expect(cell0.water).toBe(2.1 - 2);                   
        expect(worldWater.waterInCells).toBeCloseTo(2.1*5*5 - 2, 4);
        expect(worldWater.waterInCreatures).toBe(2);

        worldWater.returnWaterToCell(cell0, 1);
        expect(cell0.water).toBe(2.1 - 2 + 1);                   
        expect(worldWater.waterInCells).toBeCloseTo(2.1*5*5 - 1, 4);
        expect(worldWater.waterInCreatures).toBe(1);
        
        // gets 10 from different cells and try to return to 1 cell, over capacity

        worldWater.getWaterFromCell(grid.cell(4,0), 2);
        expect(worldWater.waterInCells).toBeCloseTo(2.1*5*5 - 1 - 2, 4);
        expect(worldWater.waterInCreatures).toBe(1 + 2);
        worldWater.getWaterFromCell(grid.cell(4,1), 2);
        worldWater.getWaterFromCell(grid.cell(4,2), 2);
        worldWater.getWaterFromCell(grid.cell(4,3), 2);
        worldWater.getWaterFromCell(grid.cell(4,4), 2);
        expect(worldWater.waterInCells).toBeCloseTo(2.1*5*5 - 1 - 10, 4);
        expect(cell1.water).toBe(2.1);              // cell previous value
        worldWater.returnWaterToCell(cell1, 10);   // greater than capacity
        expect(cell1.water).toBe(4.3);              // returns capacity

        expect(worldWater.waterInCells).toBeCloseTo(2.1*5*5 - 1 - 10 + 4.3 - 2.1, 4);
        expect(worldWater.waterInCreatures).toBe(1 + 10 - 4.3 + 2.1);
    });

})


