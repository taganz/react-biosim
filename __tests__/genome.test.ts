import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationConstants"
import Genome from "@/simulation/creature/genome/Genome";


/* https://jestjs.io/docs/expect  */

describe('genome test', () => {

    //const arrayOfGene = Array.from({length: 4}, ()=> Genome.generateRandomGene());
    const arrayOfGene = [...new Array(4)].map(() => Genome.generateRandomGene());
    const genome = new Genome(arrayOfGene);
    test ('show genome', ()=> {
      console.log("arrayOfGene: ", arrayOfGene);
      console.log("genome: ", genome);
      console.log("Genome.generateRandomGene(): ", Genome.generateRandomGene());
    }); 
    test.skip('genome clone', () => {
      expect(genome.clone()).toEqual(new Genome(arrayOfGene));
    });
});

