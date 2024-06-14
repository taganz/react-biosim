
//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationDataDefault"
import PopulationStrategy from "@/simulation/generations/population/PopulationStrategy";
import RandomFixedGenePopulation from "@/simulation/generations/population/RandomFixedGenePopulation";
import { populationStrategyFormatter } from "@/simulation/generations/population/populationStrategyFormatter";
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
import ContinuousPopulation from "@/simulation/generations/population/ContinuousPopulation";
import WorldWater from "@/simulation/water/WorldWater";
import { WaterData } from "@/simulation/water/WaterData";

/* https://jestjs.io/docs/expect  */

describe('WorldWater', () => {
    
    let waterData : WaterData;
    let worldWater : WorldWater;
    let grid : Grid;
    
    beforeEach(() => {
        waterData = constants.SIMULATION_DATA_DEFAULT.waterData;
        waterData.waterRainMaxPerCell = 1.1;
        waterData.waterFirstRainPerCell = 2.1;
        waterData.waterCellCapacity = 4.3;
        waterData.waterTotalPerCell = 2.5;
        waterData.waterEvaporationPerCellPerGeneration = 0.7;
        waterData.rainType = "rainTypeUniform";
        worldWater = new WorldWater(5, waterData);
        grid = new Grid(5, [], waterData.waterCellCapacity);
        worldWater.firstRain(grid); // all cells have 2.1
      });


    //console.log("xxx\n\n", grid.debugGetGridWater();
    test('firstRain() - test values after firstRain with enough water available', () => {
        expect(grid.cell(2,2).water).toEqual(2.1);
        expect(worldWater.waterInCreatures).toEqual(0); 
        expect(worldWater.waterInCells).toBeCloseTo(2.1*5*5, 4);
        expect(worldWater.waterInCloud).toBeCloseTo((2.5-2.1)*5*5, 4);
        expect(worldWater.totalWater).toEqual(2.5*5*5);
    });

    /*
    test('firstRain should throw error if there is not enought water', () => {
        const worldWater = new WorldWater(10);
        const grid = new Grid(5, []);
        expect(() => {worldWater.firstRain(grid, 3)}).toThrow();  // need 3 * 5 * 5 = 75 > 10   
    });
    */

    
    test('firstRain() - first rain per cell greater than cell capacity ', () => {
        waterData = constants.SIMULATION_DATA_DEFAULT.waterData;
        waterData.waterCellCapacity = 4.3;
        waterData.waterFirstRainPerCell = 10;
        waterData.waterTotalPerCell = 100;
        worldWater = new WorldWater(5, waterData);
        grid = new Grid(5, [], waterData.waterCellCapacity);
        expect(worldWater.waterData.waterFirstRainPerCell).toBe(10);
        expect(worldWater.waterInCells).toBe(0);
        expect(worldWater.waterInCloud).toBe(100*5*5);
        worldWater.firstRain(grid);    
        expect(grid.cell(2,2).water).toEqual(4.3);
        expect(grid.debugGetGridWater()).toBeCloseTo(4.3*5*5, 4);
        expect(worldWater.waterInCells).toBeCloseTo(4.3*5*5, 4);
        expect(worldWater.waterInCloud).toBeCloseTo((100-4.3)*5*5, 4);
        expect(worldWater.totalWater).toEqual(100*5*5);
        
    });

    test('rain() - enough water in cloud for rain', () => {
        expect(grid.cell(2,2).water).toBe(2.1);
        worldWater.waterData.waterRainMaxPerCell = 0.1;
        expect(worldWater.waterInCloud).toBeGreaterThanOrEqual(0.1*5*5);
        worldWater.rain(grid);
        expect(grid.cell(2,2).water).toBe(2.1 + 0.1);
        expect(worldWater.waterInCells).toBeCloseTo((2.1+0.1) * 5 * 5, 4);
        expect(worldWater.waterInCloud).toBeCloseTo((2.5-2.1-0.1) * 5 * 5, 4);
        const totalWater = worldWater.waterInCells + worldWater.waterInCloud + worldWater.waterInCreatures;
        expect(totalWater).toBeCloseTo(2.5 * 5 * 5, 4);
    });


    
    test('grid total water should match grid waterInCell', () => {
        const waterAtGridInit = grid.debugGetGridWater();
        expect(waterAtGridInit).toBeCloseTo(waterData.waterFirstRainPerCell * 5 * 5);
        expect(grid.debugGetGridWater()).toBeCloseTo(worldWater.waterInCells);
        worldWater.rain(grid);
        expect(grid.debugGetGridWater()).toEqual(worldWater.waterInCells);
    });
    test('rain - should keep total water after rain uniform', () => {
        worldWater.waterData.rainType = "rainTypeUniform";
        //worldWater.rain(grid, "rainTypeUniform", 1.7);
        worldWater.rain(grid);
        worldWater.evaporation(grid);
        expect(worldWater.totalWater).toBeCloseTo(2.5*5*5, 4);
    });
    test('rain - should keep total water after rain sinsin', () => {
        worldWater.waterData.rainType = "rainTypeSinSin";
        //worldWater.rain(grid, "rainTypeSinSin", 1.5);
        worldWater.rain(grid);
        worldWater.evaporation(grid);
        expect(worldWater.totalWater).toBeCloseTo(2.5*5*5, 4);
    });
    test('evaporation - should keep total water after evaporation', () => {
        worldWater.waterData.rainType = "rainTypeUniform";
        //worldWater.rain(grid, "rainTypeUniform", 1);
        worldWater.rain(grid);
        worldWater.evaporation(grid);
        expect(worldWater.totalWater).toBeCloseTo(2.5*5*5, 4);
    });

    test('getWaterFromCell - creature gets water from cell', () => {
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
    test('returnWaterToCellOrCloud - send water to cell, if not enought capacity send also to cloud', () => {
        const waterInCloud = worldWater.waterInCloud;
        const waterInCells = worldWater.waterInCells;
        const waterInCreatures = worldWater.waterInCreatures;
        expect(grid.cell(1,1).water).toBe(2.1);
        worldWater.returnWaterToCellOrCloud(grid.cell(1,1), 10);
        expect(grid.cell(1,1).water).toBe(4.3);
        expect(worldWater.waterInCreatures).toBeCloseTo(waterInCreatures - 10);
        expect(worldWater.waterInCells).toBeCloseTo(waterInCells + 4.3 - 2.1);
        expect(worldWater.waterInCloud).toBeCloseTo(waterInCloud + 10 - 4.3 + 2.1);
    });
})


