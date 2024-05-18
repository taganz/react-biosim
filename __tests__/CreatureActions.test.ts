
//import {describe, expect, test} from '@jest/globals';
import * as constants from "@/simulation/simulationConstants"
import PopulationStrategy from "@/simulation/generations/population/PopulationStrategy";
import RandomFixedGenePopulation from "@/simulation/generations/population/RandomFixedGenePopulation";
import { populationStrategyFormatter } from "@/simulation/generations/population/PopulationStrategyFormatter";
import CreatureBrain from "@/simulation/creature/brain/CreatureBrain";
import Genome from "@/simulation/creature/brain/Genome";
import {Grid, GridCell} from '../simulation/world/grid/Grid';
import Creature from "@/simulation/creature/Creature";
import Generations from "@/simulation/generations/WorldGenerations";
import WorldController from "@/simulation/world/WorldController";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import { testWorldControllerData } from "./testWorldControllerData";
import { testWorldGenerationsData } from "./testWorldGenerationsData";
import ContinuousPopulation from "@/simulation/generations/population/ContinuousPopulation";
import CreatureActions from "@/simulation/creature/brain/CreatureActions";


/* https://jestjs.io/docs/expect  */

describe('CreatureActions', () => {
    
    let ca : CreatureActions;
    const allActions = [
           "MoveNorth",        // 0
           "MoveSouth",        // 1
           "MoveEast",         // 2
           "MoveWest",         // 3
           "RandomMove",       // 4
           "MoveForward",      // 5
           "Photosynthesis",   // 6 
           "Reproduction",     // 7
           "Attack",           // 8
         ];

    beforeEach(() => {
        ca = new CreatureActions();
      });

    afterEach(() => {
    });
  
    test('loadFromList 2 actions and update neuronCount to 2', () => {
        const enabledActions = [
               "Photosynthesis",   // 6 
               "Reproduction",     // 7
             ];
        ca.loadFromList(enabledActions);
        expect(ca.neuronsCount).toBe(2);
    });
    test('loadFromList 2 actions and return correct getList', () => {
        const enabledActions = [
               "Photosynthesis",   // 6 
               "Reproduction",     // 7
             ];
        ca.loadFromList(enabledActions);
        expect(ca.getList()).toStrictEqual(enabledActions);
    });
    test('getFamilies ', () => {
        const enabledActions = [
               "MoveNorth",   
               "Reproduction",     
             ];
        ca.loadFromList(enabledActions);
        expect(ca.getFamily(0)).toBe("move");
        expect(ca.getFamily(1)).toBe("basic");
    });
    test('getFamilies throw error if invalid index ', () => {
        expect(() => {
            const enabledActions = [
                "MoveNorth",   
                "Reproduction",     
              ];
             ca.loadFromList(enabledActions);
             ca.getFamily(2);
            }).toThrow();
    });
})


