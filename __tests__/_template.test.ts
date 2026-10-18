
//import {describe, expect, test} from '@jest/globals';
import {Grid} from '../simulation/world/grid/Grid';
import Creature from "@/simulation/creature/Creature";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";


/* https://jestjs.io/docs/expect  */
/* per fer toThrow cal posar tot en funcio expect( () => {...} ).toThrow() */

describe('CreaturePhenotype', () => {
    
    let worldController : WorldController;
    let joe : Creature;
    let grid : Grid;
    
    beforeEach(() => {
        const simulationData : SimulationData = TEST_SIMULATION_DATA;
        simulationData.worldObjects = [];
        simulationData.worldControllerData.size = 5;
        simulationData.worldGenerationsData.initialPopulation = 3;
        worldController = new WorldController(simulationData);
        grid = worldController.generations.grid;
        //joe = worldController.generations.newCreature([1, 1]);
        //console.log(grid.debugPrintGridCreatures());
      });
    afterEach(() => {
    });
  
    test('should do', () => {
        expect(1+1).toEqual(2);
    });
})

