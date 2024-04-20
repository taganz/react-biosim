//import {describe, expect, test} from '@jest/globals';
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import * as constants from "@/simulation/simulationConstants"

/* https://jestjs.io/docs/expect  */

describe('grid basics', () => {
        const grid = new Grid(100, []); 
        function create_grid_all_isSolid(size: number) : Grid {
                const grid = new Grid(size, []);
                for (let x = 0; x < size; x++) {
                        for (let y = 0; y < size; y++) {
                                grid._grid[x][y].isSolid = true;
                        }
                }
                return grid;
        }
        test.skip('clamp negative values ', () => {
                expect(grid.clamp(-1, -1)).toStrictEqual([0, 0]);
        })
        test.skip('clamp greater values ', () => {
                expect(grid.clamp(111, 33)).toStrictEqual([99, 33]);
        })


        // cell with isSolid == false
        const g0 : GridCell =  {creature: null, objects: [], isSolid: false, water: constants.WATER_GRIDPOINT_DEFAULT, energy: constants.ENERGY_GRIDPOINT_DEFAULT};
        // cell with isSolid == true
        const g1 : GridCell =  {creature: null, objects: [], isSolid: true, water: constants.WATER_GRIDPOINT_DEFAULT, energy: constants.ENERGY_GRIDPOINT_DEFAULT};
    
        test('cell() ', () => {
                const grid5 = new Grid(5, []);
                grid5._grid[2][2].isSolid = true;
                expect(grid5.cell(2,2)).toEqual(g1);
        })
        test('isTileInsideWorld() ', () => {
                const grid5 = new Grid(5, []);        
                expect(grid5.isTileInsideWorld(-1,0)).toEqual(false);
                expect(grid5.isTileInsideWorld(0,0)).toEqual(true);
                expect(grid5.isTileInsideWorld(4,4)).toEqual(true);
                expect(grid5.isTileInsideWorld(5,5)).toEqual(false);
        })
        test('isTileEmpty() ', () => {
                const grid5 = new Grid(5, []);
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
                const grid_near_empty = new Grid(5, []);
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

});



/* prova 

import {Coordinates} from '../helpers/coordinates';
import {roundCoordinates} from '../helpers/coordinates';

describe('helpers coordinates', () => {
        test('test 1 ', () => {
                const coor : Coordinates = {x: 23.22222 , y: 24.433333};
                expect(roundCoordinates(coor, 100)).toStrictEqual({x:23.22, y:24.43});
        })
});

*/

/*
 https://jestjs.io/docs/expect
 .toBe
 .toStrictEqual
 */

