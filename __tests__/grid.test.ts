//import {describe, expect, test} from '@jest/globals';
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import Creature from "@/simulation/creature/Creature";
import Generations from "@/simulation/generations/WorldGenerations";
import WorldController from "@/simulation/world/WorldController";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import * as constants from "@/simulation/simulationDataDefault"
import WorldWater from '@/simulation/water/WorldWater';

/* https://jestjs.io/docs/expect  */

describe('grid basics', () => {
        const CELL_WATER_CAPACITY = 1;
        const grid = new Grid(100, [], CELL_WATER_CAPACITY); 
        function create_grid_all_isSolid(size: number) : Grid {
                const grid = new Grid(size, [], CELL_WATER_CAPACITY);
                for (let x = 0; x < size; x++) {
                        for (let y = 0; y < size; y++) {
                                grid._grid[x][y].isSolid = true;
                        }
                }
                return grid;
        }
        test('clamp negative values ', () => {
                expect(grid.clamp(-1, -1)).toStrictEqual([0, 0]);
        })
        test('clamp greater values ', () => {
                expect(grid.clamp(111, 33)).toStrictEqual([99, 33]);
        })


        // cell with isSolid == false
        const g0 : GridCell =  {creature: null, objects: [], isSolid: false, water: 0, waterCapacity: 5};
        // cell with isSolid == true
        const g1 : GridCell =  {creature: null, objects: [], isSolid: true, water: 0, waterCapacity: 5};
    
        test('cell() ', () => {
                const grid5 = new Grid(5, [], 5);
                grid5._grid[2][2].isSolid = true;
                expect(grid5.cell(2,2)).toEqual(g1);
        })
        test('isTileInsideWorld() ', () => {
                const grid5 = new Grid(5, [], CELL_WATER_CAPACITY);        
                expect(grid5.isTileInsideWorld(-1,0)).toEqual(false);
                expect(grid5.isTileInsideWorld(0,0)).toEqual(true);
                expect(grid5.isTileInsideWorld(4,4)).toEqual(true);
                expect(grid5.isTileInsideWorld(5,5)).toEqual(false);
        })
        test('isTileEmpty() ', () => {
                const grid5 = new Grid(5, [], CELL_WATER_CAPACITY);
                grid5._grid[2][2].isSolid = true;
                expect(grid5.isTileEmpty(0,0)).toEqual(true);
                expect(grid5.isTileEmpty(2,2)).toEqual(false);
        })
        test('getRandomAvailablePosition() - near full', () => {
                const grid_near_full = create_grid_all_isSolid(5);
                grid_near_full._grid[0][1].isSolid = false;
                expect(grid_near_full.getRandomAvailablePosition()).toStrictEqual([0,1]);
        })
        test('getRandomAvailablePosition() - full ', () => {
                const grid_all_isSolid = create_grid_all_isSolid(5);
                expect(grid_all_isSolid.getRandomAvailablePosition()).toBeNull();
        })
        test('getRandomAvailablePosition() - near empty', () => {
                const grid_near_empty = new Grid(5, [], CELL_WATER_CAPACITY);
                grid_near_empty._grid[0][1].isSolid = true;
                for(let i = 0; i < 100; i++) {
                        expect(grid_near_empty.getRandomAvailablePosition()).not.toBe([0,1]);
                }                
        })
        test('getNearByAvailablePosition() - find only available', () => {
                const grid = create_grid_all_isSolid(5);
                grid._grid[2][2].isSolid = false;
                expect(grid.getNearByAvailablePosition(1, 1)).toEqual([2,2]);

        })
        test('getNearByAvailablePosition() - find different ones', () => {
                const grid = create_grid_all_isSolid(5);
                grid._grid[1][0].isSolid = false;
                grid._grid[0][1].isSolid = false;
                grid._grid[0][0].isSolid = false;
                grid._grid[1][2].isSolid = false;
                console.log(grid.getNearByAvailablePosition(1, 1));
                console.log(grid.getNearByAvailablePosition(1, 1));
                console.log(grid.getNearByAvailablePosition(1, 1));
                console.log(grid.getNearByAvailablePosition(1, 1));

        })
        test('set waterdefault', () => {
                const grid = new Grid(5, [], 5); 
                expect(grid.cell(2,2).water).toBe(0);
        });
        test('add water limited by waterdefault', () => {
                const grid = new Grid(5, [], 4); 
                expect(grid.addWater([2, 2], 1)).toBe(1);
                expect(grid.cell(2,2).water).toBe(1);
                expect(grid.addWater([2, 2], 10)).toBe(3);  // added water = min (10, 4 - 1)
                expect(grid.cell(2,2).water).toBe(4);

        });
        
        const worldController = new WorldController(constants.SIMULATION_DATA_DEFAULT);
        const generations = new Generations(worldController, worldController.simData.worldGenerationsData, worldController.grid);
        const joe = new Creature(generations, [10, 10], true);
 
        test('getNeighbour4Creature', () => {
                const grid = new Grid(5, [], 5); 
                grid._grid[2][2].creature = joe;
                grid._grid[4][2].creature = joe;
                grid.debugPrintGridCreatures();
                console.log(grid.getNeighbour4Creature([3, 2]));
                console.log(grid.getNeighbour4Creature([3, 2]));
                console.log(grid.getNeighbour4Creature([3, 2]));
                console.log(grid.getNeighbour4Creature([3, 2]));
        });
        test('cellOffsetDirection4', () => {
                const grid = new Grid(5, [], CELL_WATER_CAPACITY); 
                grid._grid[2][2].creature = joe;
                grid._grid[4][2].creature = joe;
                grid.debugPrintGridCreatures();
                expect(grid.cellOffsetDirection4([3, 2], "N")).toEqual([3,1]);
                expect(grid.cellOffsetDirection4([3, 2], "S")).toEqual([3,3]);
                expect(grid.cellOffsetDirection4([3, 2], "E")).toEqual([4,2]);
                expect(grid.cellOffsetDirection4([5, 5], "E")).toEqual(null);
        });

});

