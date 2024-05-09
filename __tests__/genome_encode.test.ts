//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationConstants"
import Genome from "@/simulation/creature/brain/Genome";
import CreatureBrain from "@/simulation/creature/brain/CreatureBrain";


/* https://jestjs.io/docs/expect  */


  /*

        this can be used to encode geneData to geneDecimal

    */
  

describe('genome_encode', () => {


  const arrayOfGene = [...new Array(4)].map(() => Genome.generateRandomGene());
  const genome = new Genome(arrayOfGene);
  

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

