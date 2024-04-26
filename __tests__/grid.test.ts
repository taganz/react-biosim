//import {describe, expect, test} from '@jest/globals';
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import Creature from "@/simulation/creature/Creature";
import Generations from "@/simulation/generations/WorldGenerations";
import WorldController from "@/simulation/world/WorldController";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import * as constants from "@/simulation/simulationConstants"

/* https://jestjs.io/docs/expect  */

describe('grid basics', () => {
        const grid = new Grid(100, []); 
        function create_grid_all_isSolid(size: number) : Grid {
                const grid = new Grid(size, []);
                for (let x = 0; x < size; x++) {
                        for (let y = 0; y < size; y++) {
                                grid._grid[x][y].isSolid = true;
                        }
                }
                return grid;
        }
        test.skip('clamp negative values ', () => {
                expect(grid.clamp(-1, -1)).toStrictEqual([0, 0]);
        })
        test.skip('clamp greater values ', () => {
                expect(grid.clamp(111, 33)).toStrictEqual([99, 33]);
        })


        // cell with isSolid == false
        const g0 : GridCell =  {creature: null, objects: [], isSolid: false, water: constants.GRIDPOINT_WATER_DEFAULT, energy: constants.GRIDPOINT_ENERGY_DEFAULT};
        // cell with isSolid == true
        const g1 : GridCell =  {creature: null, objects: [], isSolid: true, water: constants.GRIDPOINT_WATER_DEFAULT, energy: constants.GRIDPOINT_ENERGY_DEFAULT};
    
        test.skip('cell() ', () => {
                const grid5 = new Grid(5, []);
                grid5._grid[2][2].isSolid = true;
                expect(grid5.cell(2,2)).toEqual(g1);
        })
        test.skip('isTileInsideWorld() ', () => {
                const grid5 = new Grid(5, []);        
                expect(grid5.isTileInsideWorld(-1,0)).toEqual(false);
                expect(grid5.isTileInsideWorld(0,0)).toEqual(true);
                expect(grid5.isTileInsideWorld(4,4)).toEqual(true);
                expect(grid5.isTileInsideWorld(5,5)).toEqual(false);
        })
        test.skip('isTileEmpty() ', () => {
                const grid5 = new Grid(5, []);
                grid5._grid[2][2].isSolid = true;
                expect(grid5.isTileEmpty(0,0)).toEqual(true);
                expect(grid5.isTileEmpty(2,2)).toEqual(false);
        })
        test.skip('getRandomAvailablePosition() - near full', () => {
                const grid_near_full = create_grid_all_isSolid(5);
                grid_near_full._grid[0][1].isSolid = false;
                expect(grid_near_full.getRandomAvailablePosition()).toStrictEqual([0,1]);
        })
        test.skip('getRandomAvailablePosition() - full ', () => {
                const grid_all_isSolid = create_grid_all_isSolid(5);
                expect(grid_all_isSolid.getRandomAvailablePosition()).toBeNull();
        })
        test.skip('getRandomAvailablePosition() - near empty', () => {
                const grid_near_empty = new Grid(5, []);
                grid_near_empty._grid[0][1].isSolid = true;
                for(let i = 0; i < 100; i++) {
                        expect(grid_near_empty.getRandomAvailablePosition()).not.toBe([0,1]);
                }                
        })
        test.skip('getNearByAvailablePosition() - find only available', () => {
                const grid = create_grid_all_isSolid(5);
                grid._grid[2][2].isSolid = false;
                expect(grid.getNearByAvailablePosition(1, 1)).toEqual([2,2]);

        })
        test.skip('getNearByAvailablePosition() - find different ones', () => {
                const grid = create_grid_all_isSolid(5);
                grid._grid[1][0].isSolid = false;
                grid._grid[0][1].isSolid = false;
                grid._grid[0][0].isSolid = false;
                grid._grid[1][2].isSolid = false;
                console.log(grid.getNearByAvailablePosition(1, 1));
                console.log(grid.getNearByAvailablePosition(1, 1));
                console.log(grid.getNearByAvailablePosition(1, 1));
                console.log(grid.getNearByAvailablePosition(1, 1));

        })
        test('set waterdefault', () => {
                const grid = new Grid(5, []); 
                grid.waterDefault = 0.123;
                expect(grid.cell(2,2).water).toBe(0.123);
        });
        const worldControllerData = {
                // initial values
                size: 5, 
                stepsPerGen: 10,
                initialPopulation: 1,
                worldObjects : [],
                gridPointWaterDefault: 1,

                // user values
                pauseBetweenSteps: 0,
                immediateSteps: 1,
                pauseBetweenGenerations: 0,
                
                // state values
                simCode: "XXX",
                currentGen: 0,
                currentStep: 0,
                lastGenerationDuration: 0,
                totalTime: 0
        };
        const worldGenerationsData : WorldGenerationsData = {
                populationStrategy: new AsexualZonePopulation,
                selectionMethod: new ReproductionSelection,
                initialPopulation: worldControllerData.initialPopulation,
                initialGenomeSize: 4,
                maxGenomeSize: 10,
                maxNumberNeurons: 3,
                mutationMode: MutationMode.wholeGene,
                mutationProbability: 0.05,
                deletionRatio: 0.5,
                geneInsertionDeletionProbability: 0.015,
                enabledSensors: [
                        "HorizontalPosition",
                        "VerticalPosition",
                        "Age",
                        "Oscillator",
                        "Random",
                      /*
                        "HorizontalSpeed",
                        "VerticalSpeed",
                      */
                        "HorizontalBorderDistance",
                        "VerticalBorderDistance",
                        "BorderDistance",
                        "Mass"
                      ],
                enabledActions: [
                        /*
                            "MoveNorth",
                            "MoveSouth",
                            "MoveEast",
                            "MoveWest",
                            "RandomMove",
                            "MoveForward",
                          */
                            "Photosynthesis",
                            "Reproduction"
                          ],
                // state values 
                lastCreatureIdCreated: 0,
                lastCreatureCount: 0,
                lastSurvivorsCount: 0,
                lastFitnessMaxValue: 0,
                lastSurvivalRate: 0,
                metabolismEnabled: false    //TODO afegit 20/4/24 - revisar
            };
        const worldController = new WorldController(worldControllerData, worldGenerationsData);
        const generations = new Generations(worldController, worldGenerationsData, worldController.grid);
        const joe = new Creature(generations, [10, 10]);
 
        test('getNeighbour4Creature', () => {
                const grid = new Grid(5, []); 
                grid._grid[2][2].creature = joe;
                grid._grid[4][2].creature = joe;
                grid.debugPrintGridCreatures();
                console.log(grid.getNeighbour4Creature([3, 2]));
                console.log(grid.getNeighbour4Creature([3, 2]));
                console.log(grid.getNeighbour4Creature([3, 2]));
                console.log(grid.getNeighbour4Creature([3, 2]));
        });
        test('cellOffsetDirection4', () => {
                const grid = new Grid(5, []); 
                grid._grid[2][2].creature = joe;
                grid._grid[4][2].creature = joe;
                grid.debugPrintGridCreatures();
                expect(grid.cellOffsetDirection4([3, 2], "N")).toEqual([3,1]);
                expect(grid.cellOffsetDirection4([3, 2], "S")).toEqual([3,3]);
                expect(grid.cellOffsetDirection4([3, 2], "E")).toEqual([4,2]);
                expect(grid.cellOffsetDirection4([5, 5], "E")).toEqual(null);
        });
});

