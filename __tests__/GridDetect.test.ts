
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import Creature from "@/simulation/creature/Creature";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { SIMULATION_DATA_DEFAULT } from "@/simulation/simulationDataDefault";
import { detectAll, gridDistance, detectClosest, DetectedCreature } from "@/simulation/world/grid/GridDetect";
import Genome from '@/simulation/creature/brain/Genome';

/* https://jestjs.io/docs/expect  */
/* per fer toThrow cal posar tot en funcio expect( () => {...} ).toThrow() */

describe('gridDetect', () => {
    
    let worldController : WorldController;
    let joe : Creature;
    let grid : Grid;
    let genomeAttack = new Genome([-2071420928 ]);  
    let genomeMove = new Genome([-2071945216 ]);
    let genomePlant = new Genome([-2071543808 ]);
    
    beforeEach(() => {
        const simulationData : SimulationData = SIMULATION_DATA_DEFAULT;
        // no mutation
        simulationData.worldGenerationsData.mutationProbability = 0;
        simulationData.worldGenerationsData.deletionRatio = 0;
        simulationData.worldGenerationsData.geneInsertionDeletionProbability = 0;
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
  
    test('gridDistance: distance 0 ', () => {
        expect(gridDistance( [10, 10], [10, 10])).toBe(0);
    });
    test('gridDistance: distance 1 ', () => {
        expect(gridDistance( [10, 10], [9, 10])).toBe(1);
        expect(gridDistance( [10, 10], [11, 10])).toBe(1);
        expect(gridDistance( [10, 10], [11, 11])).toBe(1);
    });
    test('gridDistance: distance 3 ', () => {
        expect(gridDistance( [10, 10], [10, 13])).toBe(3);
        expect(gridDistance( [10, 10], [13, 10])).toBe(3);
        expect(gridDistance( [10, 10], [13, 13])).toBe(3);
    });

    test('grid.detectAll(): radius 0 return empty ', () => {
        expect(detectAll(grid, [1,1], 0)).toEqual([]);
    });

    test('grid.detectAll(): radius 0 return empty ', () => {
        expect(detectAll(grid, [1,1], 0)).toEqual([]);
    });

    test('grid.detectAll(): return a neighbour inside radius ', () => {
        const ann = worldController.generations.newCreature([2, 2], true, genomePlant);
        //console.log("ann\n\n", ann.position, ann._genus);
        expect(detectAll(grid, [1,1], 2)).toEqual([{distance: 1, position: [2,2], genus: "plant"}]);
    });
    
    test('grid.detectAll(): return empty if d > radius ', () => {
        const ann = worldController.generations.newCreature([3, 3], true);
        expect(detectAll(grid, [0,0], 1)).toEqual([]);
    });
    
    test('grid.detectAll(): return array of DetectedCreatures inside radius ', () => {
        const ann = worldController.generations.newCreature([2, 2],  true,genomePlant);
        const bob = worldController.generations.newCreature([2, 3],  true,genomeAttack);
        //console.log(grid.debugPrintGridCreatures());
        //expect(detectAll(grid, [1,1], 0)).toEqual([]);
        //console.log("joeAttac\n\n", bob);
        expect(detectAll(grid, [1,1], 1)).toEqual([
            {distance: 1, position: [2,2], genus: "plant"},
        ]);
        console.log("xxxxx\n\n", detectAll(grid, [1, 1], 2));
        expect(detectAll(grid, [1,1], 2)).toEqual([
            {distance: 1, position: [2,2], genus: 'plant'},
            {distance: 2, position: [2,3], genus: 'attack'}
        ]);
    });

    test('grid.detectAll(): big radius is safe ', () => {
        const ann = worldController.generations.newCreature([2, 2], true, genomeAttack);
        const bob = worldController.generations.newCreature([2, 3], true, genomeAttack);
        console.log(grid.debugPrintGridCreatures());
        expect(detectAll(grid, [1,1], 1000)).toEqual([
            {distance: 1, position: [2,2], genus: "attack"},
            {distance: 2, position: [2,3], genus: "attack"}
        ]);
    });

    test('grid.detectAll(): negative radius is safe ', () => {
        const ann = worldController.generations.newCreature([2, 2], true, genomeAttack);
        const bob = worldController.generations.newCreature([2, 3], true, genomeAttack);
        console.log(grid.debugPrintGridCreatures());
        expect(detectAll(grid, [1,1], -1000)).toEqual([
            {distance: 1, position: [2,2], genus: "attack"},
            {distance: 2, position: [2,3], genus: "attack"}
        ]);
    });


    test('grid.detectAll(): origin at grid limit ', () => {
        const ann = worldController.generations.newCreature([2, 2], true, genomePlant);
        const bob = worldController.generations.newCreature([2, 3], true, genomePlant);
        expect(detectAll(grid, [0,0], 3)).toEqual([
            {distance: 2, position: [2,2], genus: "plant"},
            {distance: 3, position: [2,3], genus: "plant"}
        ]);
        expect(detectAll(grid, [4,4], 3)).toEqual([
            {distance: 2, position: [2,2], genus: "plant"},
            {distance: 2, position: [2,3], genus: "plant"}
        ]);
    });
    test('grid.detectAll(): big grid ', () => {
        const simulationData : SimulationData = SIMULATION_DATA_DEFAULT;
        // no mutation
        simulationData.worldGenerationsData.mutationProbability = 0;
        simulationData.worldGenerationsData.deletionRatio = 0;
        simulationData.worldGenerationsData.geneInsertionDeletionProbability = 0;
        simulationData.worldObjects = [];
        simulationData.worldControllerData.size = 1000;
        simulationData.worldGenerationsData.initialPopulation = 3;
        worldController = new WorldController(simulationData);
        grid = worldController.generations.grid;
        //console.log("big grid size: ", grid.size);
        worldController.generations.newCreature([902, 902], true, genomePlant);
        //console.log(grid.cell(902, 902));
        expect(detectAll(grid, [900, 900], 12)).toEqual([
            {distance: 2, position: [902,902], genus: "plant"},
        ]);
    });

    test('grid.detectClosest(): returns closest creature ', () => {
        const ann = worldController.generations.newCreature([2, 2], true, genomePlant);
        const bob = worldController.generations.newCreature([2, 3], true, genomePlant);
        //console.log(grid.debugPrintGridCreatures());
        expect(detectClosest(grid, [1, 1], 3)).toEqual(
            {distance: 1, position: [2,2], genus: "plant"},
        );
    });

    test('grid.detectClosest(): returns closest creature for a given genus ', () => {
        let genomeAttack = new Genome([-2071420928 ]);
        let genomeMove = new Genome([-2071945216 ]);
        let genomePlant = new Genome([-2071543808 ]);
        let joePlant = worldController.generations.newCreature([1, 0], true, genomePlant);
        let joeMove = worldController.generations.newCreature([2, 0], true, genomeMove);
        let joeAttack = worldController.generations.newCreature([3, 0], true, genomeAttack);
        //console.log(grid.debugPrintGridCreatures());
        //console.log("eeeeeee\n\n", joePlant.position, joeMove.position, joeAttack.position);
        //console.log("yyyyyy\n\n", detectAll(grid, [2,0], 3));
        //console.log("yyyyyy\n\n", detectClosest(grid, [2,0], 3));
        //console.log("xxxxxxx\n\n", detectClosest(grid, [2,0], 3, "attack_plant"));
        expect(detectClosest(grid, [2, 0], 3, "plant")).toEqual(
            {distance: 1, position: [1,0], genus: "plant"},
        );
        expect(detectClosest(grid, [2, 0], 3, "attack")).toEqual(
            {distance: 1, position: [3,0], genus: "attack"},
        );
    });

    test('grid.detectClosest(): no creatures for given genus ', () => {
        let genomeAttack = new Genome([-2071420928 ]);
        let genomeMove = new Genome([-2071945216 ]);
        let genomePlant = new Genome([-2071543808 ]);
        let joePlant = worldController.generations.newCreature([1, 0], true, genomePlant);
        let joeMove = worldController.generations.newCreature([2, 0], true, genomeMove);
        let joeAttack = worldController.generations.newCreature([3, 0], true, genomeAttack);
        //console.log(grid.debugPrintGridCreatures());
        //console.log("eeeeeee\n\n", joePlant.position, joeMove.position, joeAttack.position);
        //console.log("yyyyyy\n\n", detectAll(grid, [2,0], 3));
        //console.log("yyyyyy\n\n", detectClosest(grid, [2,0], 3));
        //console.log("xxxxxxx\n\n", detectClosest(grid, [2,0], 3, "attack_plant"));
        expect(detectClosest(grid, [2, 0], 3, "attack_plant")).toBeNull();
    });



    test.skip('sensor preyDirection', () => {
        //expect(CreatureSensors.calculateOutputs(joe)).toEqual([1]):
        expect(1+1).toEqual(2);
    });
    test.skip('sensor preyDistance', () => {
        expect(1+1).toEqual(2);
    });
    test.skip('sensor predatorDirection', () => {
        expect(1+1).toEqual(2);
    });
    test.skip('sensor predatorDistance', () => {
        expect(1+1).toEqual(2);
    });
    test.skip('log target prey for debug', () => {
        expect(1+1).toEqual(2);
    });
    test.skip('log target predator for debug', () => {
        expect(1+1).toEqual(2);
    });
    
})


