//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationConstants"
import Genome from "@/simulation/creature/brain/Genome";
import CreatureBrain from "@/simulation/creature/brain/CreatureBrain";


/* https://jestjs.io/docs/expect  */



describe('genome test', () => {


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
    test("getGeneData 0", ()=> {
      const geneData = [ 1, 3, 1, 4, 49152 ]; // weight = 2
      const geneDecimal = -2088452096; 
      const genome = new Genome([geneDecimal]);
      const geneDataReceived = genome.getGeneData(0);
      expect(geneDataReceived).toEqual(geneData)
    });
    test("Genome.encodeGeneData", ()=> {
      const geneData = [ 1, 3, 1, 4, 49152 ];  // weight = 2
      const geneDecimal = -2088452096;
      const geneDecimalReceived = Genome.encodeGeneData(geneData);
      expect(geneDecimalReceived).toEqual(geneDecimal)
      console.log ("geneDecimal: ", geneDecimal, " geneDecimalReceived: ", geneDecimalReceived);
    });
    test("Genome.decodeGeneData", ()=> {
      const geneData = [ 1, 3, 1, 4, 49152 ];  // weight = 2
      const geneDecimal = -2088452096;
      const geneDataReceived = Genome.decodeGeneData(geneDecimal);
      expect(geneDataReceived).toEqual(geneData);
      console.log ("geneData: ", geneData, " geneDataReceived: ", geneDataReceived);
    });

});

