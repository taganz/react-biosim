// WORKING FILE

import { populationStrategyFormatter } from "@/simulation/generations/population/PopulationStrategyFormatter";
import WorldController from "@/simulation/world/WorldController";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import { testWorldControllerData } from "./testWorldControllerData";
import { testWorldGenerationsData } from "./testWorldGenerationsData";
import InsideReproductionAreaSelection from "@/simulation/generations/selection/InsideReproductionAreaSelection";
import GreatestDistanceSelection from "@/simulation/generations/selection/GreatestDistanceSelection";
import ContinuousSelection from "@/simulation/generations/selection/ContinuousSelection";
import { selectionMethodFormatter } from "@/simulation/generations/selection/SelectionMethodFormatter";

export type SavedPopulationStrategy = string;

/* https://jestjs.io/docs/expect  */

describe('selection methods', () => {

        
        //const worldControllerData = testWorldControllerData;
        //const worldGenerationsData = testWorldGenerationsData
        //const worldController = new WorldController(testWorldControllerData, testWorldGenerationsData);
        //const generations = new Generations(worldController, worldGenerationsData, worldController.grid);
        //const joe = new Creature(generations, [3, 3]);
        //const arrayOfGene = [...new Array(4)].map(() => Genome.generateRandomGene());
        //const genome = new Genome(arrayOfGene);
        

        test('selectionMethodFormatter serialize all methods ', () => {
                const iras = new InsideReproductionAreaSelection();
                const rs = new ReproductionSelection();
                const gds = new GreatestDistanceSelection();
                const cs = new ContinuousSelection();
                expect(selectionMethodFormatter.serialize(iras)).toEqual("InsideReproductionAreaSelection");
                expect(selectionMethodFormatter.serialize(rs)).toEqual("ReproductionSelection");
                expect(selectionMethodFormatter.serialize(gds)).toEqual("GreatestDistanceSelection");
                expect(selectionMethodFormatter.serialize(cs)).toEqual("ContinuousSelection");
        });
        test('populationStrategyFormatter deserialize all strategiess', () => {
                const iras = new InsideReproductionAreaSelection();
                const rs = new ReproductionSelection();
                const gds = new GreatestDistanceSelection();
                const cs = new ContinuousSelection();
                expect(selectionMethodFormatter.deserialize("InsideReproductionAreaSelection")).toEqual(iras);
                expect(selectionMethodFormatter.deserialize("ReproductionSelection")).toEqual(rs);
                expect(selectionMethodFormatter.deserialize("GreatestDistanceSelection")).toEqual(gds);
                expect(selectionMethodFormatter.deserialize("ContinuousSelection")).toEqual(cs);
        });
});



