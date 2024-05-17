
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

/* https://jestjs.io/docs/expect  */

describe('CreaturePhenotype', () => {
    
    beforeEach(() => {
        const setCount = jest.fn();
      });

    afterEach(() => {
    });
  
    test('should do', () => {
        expect(1+1).toEqual(2);
    });
})


