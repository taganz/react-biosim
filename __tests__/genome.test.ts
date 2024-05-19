//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationDataDefault"
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
    test('genome clone', () => {
      expect(genome.clone()).toEqual(new Genome(arrayOfGene));
    });
    test("getGeneData 0", ()=> {
      const geneData = [ 1, 3, 1, 4, 2 ]; // weight = 2
      const geneDecimal = -2088452096; 
      const genome = new Genome([geneDecimal]);
      const geneDataReceived = genome.getGeneData(0);
      expect(geneDataReceived).toEqual(geneData)
    });
    test("Genome.encodeGeneData 2", ()=> {
      const geneData = [ 1, 3, 1, 4, 2 ];  // weight = 2
      const geneDecimal = -2088452096;
      const geneDecimalReceived = Genome.encodeGeneData(geneData);
      expect(geneDecimalReceived).toEqual(geneDecimal)
      console.log ("geneDecimal: ", geneDecimal, " geneDecimalReceived: ", geneDecimalReceived);
    });
    test("Genome.decodeGeneData 2", ()=> {
      const geneData = [ 1, 3, 1, 4, 2 ];  // weight = 2
      const geneDecimal = -2088452096;
      const geneDataReceived = Genome.decodeGeneData(geneDecimal);
      expect(geneDataReceived).toEqual(geneData);
      console.log ("geneData: ", geneData, " geneDataReceived: ", geneDataReceived);
    });

    test("Genome.addGenes ", ()=> {
      const genome2 = new Genome([100, 200]);
      genome2.addGenes([300, 400]);
      expect(genome2.genes).toEqual([100, 200, 300, 400]);
    });
    test("Genome.addGenes - empty input", ()=> {
      const genome2 = new Genome([100, 200]);
      genome2.addGenes([]);
      expect(genome2.genes).toEqual([100, 200]);
    });
    test('create a genome and read genes[0]', ()=> {
      const arrayOfGene2 =  [ 877851504, -1670333449, -262346379, -1609458441 ]  
      const genome2 = new Genome(arrayOfGene2);
      const xx = genome2.getGeneData(0);
      expect(genome2.genes[0]).toBe(877851504);

    });
    test('clone a genome without mutation', ()=> {
      const arrayOfGene2 =  [ 877851504, -1670333449, -262346379, -1609458441 ]  
      const genome2 = new Genome(arrayOfGene2);
      const genomeCloned : Genome = genome2.clone();
      expect(genomeCloned).toStrictEqual(genome2);
    });
    test('addGenes()', ()=> {
      const arrayOfGene2 =  [ 877851504 ]  
      const genome2 = new Genome(arrayOfGene2);
      genome2.addGenes([-1670333449, -262346379]);
      expect(genome2.genes).toStrictEqual([877851504, -1670333449, -262346379]);
    });
    test('decodeGeneData ', ()=> {
      expect(Genome.decodeGeneData(877851504)).toStrictEqual( [ 0, 52, 0, 82, 3.607421875 ]);
    });
    test('encodeGeneData ', ()=> {
      expect(Genome.encodeGeneData( [ 0, 52, 0, 82, 3.607421875 ])).toBe(877851504);
    });
    test('compare() two equal genomes is true', ()=> {
      const arrayOfGene2 =  [ 877851504, -1670333449, -262346379, -1609458441 ];
      const genome2 = new Genome(arrayOfGene2);
      const genome3 = new Genome(arrayOfGene2);
      expect(genome2.compare(genome3)).toBe(true);
    });

    /*

        this can be used to encode geneData to geneDecimal

    */
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

