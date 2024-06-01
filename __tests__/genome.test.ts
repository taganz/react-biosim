//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationDataDefault"
import Genome, {geneToString} from "@/simulation/creature/brain/Genome";
import CreatureBrain from "@/simulation/creature/brain/CreatureBrain";
import { ConnectionType } from "@/simulation/creature/brain/Connection";
import WorldController from "@/simulation/world/WorldController";

/* https://jestjs.io/docs/expect  */



describe('genome test', () => {

  const arrayOfGene = [...new Array(4)].map(() => Genome.generateRandomGene());
  const genome = new Genome(arrayOfGene);

  const worldController = new WorldController(constants.SIMULATION_DATA_DEFAULT);
  const generations = worldController.generations;


    test('genome clone', () => {
      expect(genome.clone()).toEqual(new Genome(arrayOfGene));
    });
    test("genesIndexToConnection 0", ()=> {
      const connection = { sourceType: 1,
                          sourceId: 3,
                          sinkType: 1,
                          sinkId:  4,
                          weight: 2 
                      };
      const geneDecimal = -2088452096; 
      const genome2 = new Genome([geneDecimal]);
      const geneDataReceived = Genome.geneToConnection(genome2.genes[0], generations);
      expect(geneDataReceived).toEqual(connection)
    });
    test("Genome.connectionToGene 2", ()=> {
      const connection = { sourceType: 1,
                          sourceId: 3,
                          sinkType: 1,
                          sinkId:  4,
                          weight: 2 
                      };
      const geneDecimal = -2088452096;
      const geneDecimalReceived = Genome.connectionToGene(connection);
      expect(geneDecimalReceived).toEqual(geneDecimal)
      console.log ("geneDecimal: ", geneDecimal, " geneDecimalReceived: ", geneDecimalReceived);
    });
    test("Genome.geneToConnection 2", ()=> {
      const connection = {
        sourceType: 1,
        sourceId:   3,
        sinkType:   1,
        sinkId:     4,
        weight:     2 
    };
      const geneDecimal = -2088452096;
      const geneDataReceived = Genome.geneToConnection(geneDecimal, generations);
      expect(geneDataReceived).toEqual(connection);
      console.log ("connection: ", connection, " geneDataReceived: ", geneDataReceived);
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
    test('geneToConnection() - inverse of connectionToGene() ', ()=> {
      const connection =     {
            sourceType: 0,
            sourceId: 2,
            sinkType: 0,
            sinkId:  3,
            weight: 3.607421875 
        };
      const gene = Genome.connectionToGene(connection);
      expect(Genome.geneToConnection(gene, generations)).toStrictEqual(connection);
    });
    test('connectionToGene ', ()=> {
      const connection = {
          sourceType: 1,
          sourceId:   3,
          sinkType:   1,
          sinkId:     4,
          weight:     2 
      };
      expect(Genome.connectionToGene( connection)).toBe(-2088452096);
    });
    test('compare() two equal genomes is true', ()=> {
      const arrayOfGene2 =  [ 877851504, -1670333449, -262346379, -1609458441 ];
      const genome2 = new Genome(arrayOfGene2);
      const genome3 = new Genome(arrayOfGene2);
      expect(genome2.compare(genome3)).toBe(true);
    });
    test('addGenesToLength() ', ()=> {
      expect(Genome.addGenesToLength( [1, 2], 7).length).toBe(7);
      expect(Genome.addGenesToLength( [1, 2], 1).length).toBe(2);
    });
    test('geneToString()', ()=> {
      let connection = {
        sourceType: 1,
        sourceId:   3,
        sinkType:   1,
        sinkId:     4,
        weight:     2 
      };
      let gene = Genome.connectionToGene(connection);
      //console.log("geneToString gene: ", gene, "\n\n", geneToString(generations, gene));
      expect(geneToString(generations, gene)).toEqual("[Random] ---> 2.00 ---> [RandomMove]");
    })

    /*

        this can be used to encode connection to geneDecimal

    */
    test("ENCODING TOOL", ()=> {
      let connection : ConnectionType;
      let geneDecimal : number;

      //connection:  [ 1, 3, 1, 4, 2 ]  geneDecimal:  -2088452096       
      // 3.Oscillator -- 2 --> 4.RandomMove
      connection = {
        sourceType: 1,
        sourceId:   3,
        sinkType:   1,
        sinkId:     4,
        weight:     2 
    };
      geneDecimal = Genome.connectionToGene(connection);
      expect(Genome.geneToConnection(geneDecimal, generations)).toEqual(connection);
      console.log ("connection: ", connection, " geneDecimal: ", geneDecimal);

      // connection:  [ 1, 4, 1, 6, 2 ]  geneDecimal:  -2071543808  
      // 4.Random -- 2 --> 6.Photosynthesis
      connection = {
        sourceType: 1,
        sourceId:   4,
        sinkType:   1,
        sinkId:     6,
        weight:     2 
       };
      geneDecimal = Genome.connectionToGene(connection); // 
      expect(Genome.geneToConnection(geneDecimal, generations)).toEqual(connection);
      console.log ("connection: ", connection, " geneDecimal: ", geneDecimal);

      // connection:  [ 1, 4, 1, 7, 1 ]  geneDecimal:  -2071486464   
      // 4.Random -- 1 --> 7.Reproduction
      connection = {
        sourceType: 1,
        sourceId:   4,
        sinkType:   1,
        sinkId:     7,
        weight:     1 
       };
      geneDecimal = Genome.connectionToGene(connection);
      expect(Genome.geneToConnection(geneDecimal, generations)).toEqual(connection);
      console.log ("connection: ", connection, " geneDecimal: ", geneDecimal);

      // connection:  [ 1, 4, 1, 8, 1 ]  geneDecimal:  -2071420928   
      // 4.Random -- 1 --> 8.Attack
      connection = {
        sourceType: 1,
        sourceId:   4,
        sinkType:   1,
        sinkId:     8,
        weight:     1 
       };
      geneDecimal = Genome.connectionToGene(connection);
      expect(Genome.geneToConnection(geneDecimal, generations)).toEqual(connection);
      console.log ("connection: ", connection, " geneDecimal: ", geneDecimal);

      // connection:  [ 1, 4, 1, 0, 1 ]  geneDecimal:  -2071945216   
      // 4.Random -- 1 --> 0.MoveNorth
      connection = {
        sourceType: 1,
        sourceId:   4,
        sinkType:   1,
        sinkId:     0,
        weight:     1 
       };

      geneDecimal = Genome.connectionToGene(connection);
      expect(Genome.geneToConnection(geneDecimal, generations)).toEqual(connection);
      console.log ("connection: ", connection, " geneDecimal: ", geneDecimal);

    });

});

