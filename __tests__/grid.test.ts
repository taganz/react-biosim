import {describe, expect, test} from '@jest/globals';
import {Grid} from '../simulation/world/grid/Grid';

describe('grid clamp', () => {
        const grid = new Grid(100); 
        test('clamp negative values ', () => {
                expect(grid.clamp(-1, -1)).toStrictEqual([0, 0]);
        })
        test('clamp greater values ', () => {
                expect(grid.clamp(111, 33)).toStrictEqual([99, 33]);
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

