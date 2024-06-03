
//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationDataDefault"
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import Creature from "@/simulation/creature/Creature";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { SIMULATION_DATA_DEFAULT } from "@/simulation/simulationDataDefault";
import CreatureMass from "@/simulation/creature/CreatureMass";
import WorldWater from "@/simulation/water/WorldWater";
import WorldGenerations from "@/simulation/generations/WorldGenerations";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus from "@/simulation/creature/CreatureGenus";

/* https://jestjs.io/docs/expect  */
/* per fer toThrow cal posar tot en funcio expect( () => {...} ).toThrow() */

describe('CreaturePhenotype', () => {
    
    let worldController : WorldController;
    let joe : Creature;
    let grid : Grid;
    let mass : CreatureMass;
    let worldWater : WorldWater;
    let generations : WorldGenerations;
    let joePlant : Creature;
    let joeAttackPlant : Creature;
    let joeAttackAnimal : Creature;
    let mockWaterWorld : WorldWater;
       
    
    beforeEach(() => {
        const simulationData : SimulationData = SIMULATION_DATA_DEFAULT;
        simulationData.worldObjects = [];
        simulationData.worldControllerData.size = 5;
        simulationData.worldGenerationsData.initialPopulation = 3;
        simulationData.worldGenerationsData.metabolismEnabled = true;
        simulationData.worldControllerData.MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE = 0.001;
        
        simulationData.waterData.waterFirstRainPerCell = 2;     
        simulationData.waterData.waterCellCapacity = 1000;
        simulationData.waterData.waterTotalPerCell = 10;       // total water 250
        simulationData.waterData.waterRainMaxPerCell = 0;
        simulationData.waterData.waterEvaporationPerCellPerGeneration = 0;
                
        simulationData.worldControllerData.MASS_AT_BIRTH_PLANT = 1;
        simulationData.worldControllerData.MASS_AT_BIRTH_ATTACK_PLANT = 2;
        simulationData.worldControllerData.MASS_AT_BIRTH_ATTACK_ANIMAL = 3;
        worldController = new WorldController(simulationData);
        grid = worldController.generations.grid;
        generations = worldController.generations;
        worldWater = worldController.worldWater;

        //console.log(worldWater.waterData);

        // create creatures --> will take water from cloud to waterInCreatures
        let genomePlant = new Genome([CreatureGenus.mainGeneForGenus(generations, "plant")]);
        joePlant = worldController.generations.newCreature([1, 0], true, genomePlant);
        let genomeAttackPlant = new Genome([CreatureGenus.mainGeneForGenus(generations, "attack_plant")]);
        joeAttackPlant = worldController.generations.newCreature([2, 0], true, genomeAttackPlant);
        let genomeAttackAnimal = new Genome([CreatureGenus.mainGeneForGenus(generations, "attack_animal")]);
        joeAttackAnimal = worldController.generations.newCreature([3, 0], true, genomeAttackAnimal);
       
      });
    afterEach(() => {
    });

    test('worldWater initial values ', () => {
        expect(worldWater.totalWater).toBe(250);
        expect(worldWater.waterInCells).toBe(50);   // first rain 2 * 25 = 50
        expect(worldWater.waterInCreatures).toBe(6);    // 3 creatures
        expect(worldWater.waterInCloud).toBe(194);  // 250 - 6 - 50
    });

    test('constructor: massAtBirth == mass', () => {
        mass = joeAttackAnimal._mass;
        expect(mass.mass).toBe(3);
        expect(mass.mass).toBe(3);
    });

    test('consume - send mass from mass to waterInCloud', ()=> {
        mass = joeAttackAnimal._mass;
        mass.consume(1);
        
        expect(mass.mass).toBe(3 - 1);
        expect(mass._worldWater.totalWater).toBe(250);
        expect(mass._worldWater.waterInCreatures).toBe(6 - 1);
        expect(mass._worldWater.waterInCloud).toBe(194 + 1);
        expect(mass._worldWater.waterInCells).toBe(50);
    });
    test('basalMetabolism - send mass from mass to waterInCloud', ()=> {
        mass = joeAttackAnimal._mass;
        
        mass.basalMetabolism();
        
        expect(mass.mass).toBe(3 - mass._basalConsumption );
        expect(mass._worldWater.totalWater).toBe(250);
        expect(mass._worldWater.waterInCreatures).toBe(6 - mass._basalConsumption );
        expect(mass._worldWater.waterInCloud).toBe(194 + mass._basalConsumption);
        expect(mass._worldWater.waterInCells).toBe(50);
    });
    test('addFromPrey - add mass without changing waterInCloud', ()=> {
        mass = joeAttackAnimal._mass;
        
        mass.addFromPrey(1);
        
        expect(mass.mass).toBe(3 + 1);
        expect(mass._worldWater.totalWater).toBe(250);
        expect(mass._worldWater.waterInCreatures).toBe(6);
        expect(mass._worldWater.waterInCloud).toBe(194);
        expect(mass._worldWater.waterInCells).toBe(50);
    });
    test('addFromGrid - add mass from waterInGrid', ()=> {
        mass = joeAttackAnimal._mass;
        
        const cell = grid.cell(joeAttackAnimal.position[0], joeAttackAnimal.position[1]);
        mass.addFromGrid(cell, 1);
        
        expect(mass.mass).toBe(3 + 1);
        expect(mass._worldWater.totalWater).toBe(250);
        expect(mass._worldWater.waterInCreatures).toBe(6 + 1);
        expect(mass._worldWater.waterInCloud).toBe(194);
        expect(mass._worldWater.waterInCells).toBe(50 - 1);
    });
    test('consume - reduce mass and send to cloud', ()=> {
        mass = joeAttackAnimal._mass;
        
        mass.consume(1);
        
        expect(mass.mass).toBe(3 - 1);
        expect(mass._worldWater.totalWater).toBe(250);
        expect(mass._worldWater.waterInCreatures).toBe(6 - 1);
        expect(mass._worldWater.waterInCloud).toBe(194 + 1);
        expect(mass._worldWater.waterInCells).toBe(50);
    });    
    test('consumeMassFraction - reduce mass and send to cloud', ()=> {
        mass = joeAttackAnimal._mass;
        
        mass.consumeMassFraction(0.5);
        
        expect(mass.mass).toBe(3 - 1.5);
        expect(mass._worldWater.totalWater).toBe(250);
        expect(mass._worldWater.waterInCreatures).toBe(6 - 1.5);
        expect(mass._worldWater.waterInCloud).toBe(194 + 1.5);
        expect(mass._worldWater.waterInCells).toBe(50);
    });    
    test('die - reduce mass to zero and send to cell', ()=> {
        mass = joeAttackAnimal._mass;
        
        mass.die();
        
        expect(mass.mass).toBe(3 - 3);
        expect(mass._worldWater.totalWater).toBe(250);
        expect(mass._worldWater.waterInCreatures).toBe(6 - 3);
        expect(mass._worldWater.waterInCloud).toBe(194);
        expect(mass._worldWater.waterInCells).toBe(50 + 3);
    });    

})

