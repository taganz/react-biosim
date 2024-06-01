import * as constants from "@/simulation/simulationConstants"
import PopulationStrategy from "@/simulation/generations/population/PopulationStrategy";
import RandomFixedGenePopulation from "@/simulation/generations/population/RandomFixedGenePopulation";
import { populationStrategyFormatter } from "@/simulation/generations/population/populationStrategyFormatter";
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
import { saveWorld } from "@/simulation/serialization/saveWorld";
import SavedWorldControllerData from "@/simulation/serialization/data/SavedWorldControllerData";
describe('Serialization', () => {
    
    const wcd : WorldControllerData  = testWorldControllerData;
    const wgd : WorldGenerationsData = testWorldGenerationsData;

    beforeEach(() => {
    });
  
    afterEach(() => {
    });
  
    test('serialize deserialize worldControllerData ', () => {
        const worldController = new WorldController(testWorldControllerData, testWorldGenerationsData);
        const savedWorldController : SavedWorld = saveWorld(worldController);

        console.log(savedWorldController);
        expect(savedWorldController.worldGenerationsData).toEqual(testWorldGenerationsData);
    });
})
