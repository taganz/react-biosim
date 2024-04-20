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
    test.skip("getGeneData 0", ()=> {
      const geneData = [ 1, 3, 1, 4, 2 ]; // weight = 2
      const geneDecimal = -2088452096; 
      const genome = new Genome([geneDecimal]);
      const geneDataReceived = genome.getGeneData(0);
      expect(geneDataReceived).toEqual(geneData)
    });
    test.skip("Genome.encodeGeneData 2", ()=> {
      const geneData = [ 1, 3, 1, 4, 2 ];  // weight = 2
      const geneDecimal = -2088452096;
      const geneDecimalReceived = Genome.encodeGeneData(geneData);
      expect(geneDecimalReceived).toEqual(geneDecimal)
      console.log ("geneDecimal: ", geneDecimal, " geneDecimalReceived: ", geneDecimalReceived);
    });
    test.skip("Genome.decodeGeneData 2", ()=> {
      const geneData = [ 1, 3, 1, 4, 2 ];  // weight = 2
      const geneDecimal = -2088452096;
      const geneDataReceived = Genome.decodeGeneData(geneDecimal);
      expect(geneDataReceived).toEqual(geneData);
      console.log ("geneData: ", geneData, " geneDataReceived: ", geneDataReceived);
    });
    test("ENCODING TOOL", ()=> {
      let geneData : number[];
      let geneDecimal : number;

      //geneData:  [ 1, 3, 1, 4, 2 ]  geneDecimal:  -2088452096       
      geneData = [ 1, 3, 1, 4, 2 ];  // 3.Oscillator -- 2 --> 4.RandomMove
      geneDecimal = Genome.encodeGeneData(geneData);
      expect(Genome.decodeGeneData(geneDecimal)).toEqual(geneData);
      console.log ("geneData: ", geneData, " geneDecimal: ", geneDecimal);

      // geneData:  [ 1, 4, 1, 6, 2 ]  geneDecimal:  -2071543808  
      geneData = [ 1, 4, 1, 6, 2 ];  // 4.Random -- 2 --> 6.Photosynthesis
      geneDecimal = Genome.encodeGeneData(geneData); // 
      expect(Genome.decodeGeneData(geneDecimal)).toEqual(geneData);
      console.log ("geneData: ", geneData, " geneDecimal: ", geneDecimal);

      // geneData:  [ 1, 4, 1, 7, 1 ]  geneDecimal:  -2071486464   
      geneData = [ 1, 4, 1, 7, 1 ];  // 4.Random -- 1 --> 7.Reproduction
      geneDecimal = Genome.encodeGeneData(geneData);
      expect(Genome.decodeGeneData(geneDecimal)).toEqual(geneData);
      console.log ("geneData: ", geneData, " geneDecimal: ", geneDecimal);
    });
});

