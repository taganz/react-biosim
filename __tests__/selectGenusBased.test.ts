/* https://jestjs.io/docs/expect  */
/* per fer toThrow cal posar tot en funcio expect( () => {...} ).toThrow() */

import { selectGenusBasedOnProbability, GenusProbability } from "@/simulation/generations/population/selectGenusBasedOnProbability";
import { Genus } from "@/simulation/creature/CreatureGenus";

describe('selectGenusBasedOnProbability', () => {
    
    test('should do', () => {
            
        const genera : GenusProbability[] = [{genus: "plant", probability: 0.8},
            {genus: "attack_plant", probability: 0.2}];

        let str = "";
        for(let i=0;i<100;i++) {
            str += selectGenusBasedOnProbability(genera) +"\n";
        };
        //console.log(str);
        
        expect(1).toBe(1);
    });
})

