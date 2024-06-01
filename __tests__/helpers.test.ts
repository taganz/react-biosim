
//import {describe, expect, test} from '@jest/globals';
import { getRandomItem } from "@/simulation/helpers/helpers";


/* https://jestjs.io/docs/expect  */
/* per fer toThrow cal posar tot en funcio expect( () => {...} ).toThrow() */

describe('helpers', () => {

    beforeEach(() => {
      });
    afterEach(() => {
    });
  
    test('getRandomItem', () => {
        let str = "";
        for (let i = 1;i<30;i++) {
            str += getRandomItem([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).toString();
        }
        console.log(str);
        //expect().toEqual(2);
    });
})

