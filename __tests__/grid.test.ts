import {describe, expect, test} from '@jest/globals';
import {Grid, GridCell} from '../simulation/world/grid/Grid';

describe('grid basics', () => {
        const grid = new Grid(100); 
        test.skip('clamp negative values ', () => {
                expect(grid.clamp(-1, -1)).toStrictEqual([0, 0]);
        })
        test.skip('clamp greater values ', () => {
                expect(grid.clamp(111, 33)).toStrictEqual([99, 33]);
        })
        const g0 : GridCell =  {creature: null, objects: [], isSolid: false, water: 0, energy: 0};
        const g1 : GridCell =  {creature: null, objects: [], isSolid: true, water: 0, energy: 0};
        const grid5 = new Grid(5);
        grid5.addRow([g0, g0, g0, g0, g0]);
        grid5.addRow([g0, g0, g0, g0, g0]);
        grid5.addRow([g0, g0, g1, g0, g0]);
        grid5.addRow([g0, g0, g0, g0, g0]);
        grid5.addRow([g0, g0, g0, g0, g0]);
        grid5.addRow([g0, g0, g0, g0, g0]);
        const grid5_full = new Grid(5);
        grid5_full.addRow([g1, g1, g1, g1, g1]);
        grid5_full.addRow([g1, g1, g1, g1, g1]);
        grid5_full.addRow([g1, g1, g1, g1, g1]);
        grid5_full.addRow([g1, g1, g1, g1, g1]);
        grid5_full.addRow([g1, g1, g1, g1, g1]);
        test.skip('cell() ', () => {
                expect(grid5.cell(2,2)).toEqual(g1);
        })
        test.skip('isTileInsideWorld() ', () => {
                expect(grid5.isTileInsideWorld(-1,0)).toEqual(false);
                expect(grid5.isTileInsideWorld(0,0)).toEqual(true);
                expect(grid5.isTileInsideWorld(4,4)).toEqual(true);
                expect(grid5.isTileInsideWorld(5,5)).toEqual(false);
        })
        test.skip('isTileEmpty() ', () => {
                expect(grid5.isTileEmpty(0,0)).toEqual(true);
                //console.log(grid5.cell(2,2));
                expect(grid5.isTileEmpty(2,2)).toEqual(false);
        })
        test.skip('getRandomAvailable() - near empty array ', () => {
                for(let i = 0; i < 100; i++) {
                        expect(grid5.getRandomAvailablePosition()).not.toBeNull();
                }                
        })
        test.skip('getRandomAvailable() - full ', () => {
                expect(grid5_full.getRandomAvailablePosition()).toBeNull();
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

