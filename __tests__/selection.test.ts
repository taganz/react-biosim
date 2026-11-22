// WORKING FILE

import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import InsideReproductionAreaSelection from "@/simulation/generations/selection/InsideReproductionAreaSelection";
import GreatestDistanceSelection from "@/simulation/generations/selection/GreatestDistanceSelection";
import { selectionMethodFormatter } from "@/simulation/generations/selection/selectionMethodFormatter";
import GreatestMassSelection
 from "@/simulation/generations/selection/GreatestMassSelection";
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
                const gms = new GreatestMassSelection();
                expect(selectionMethodFormatter.serialize(iras)).toEqual("InsideReproductionAreaSelection");
                expect(selectionMethodFormatter.serialize(rs)).toEqual("ReproductionSelection");
                expect(selectionMethodFormatter.serialize(gds)).toEqual("GreatestDistanceSelection");
                expect(selectionMethodFormatter.serialize(gms)).toEqual("GreatestMassSelection");
        });
        test('populationStrategyFormatter deserialize all strategiess', () => {
                const iras = new InsideReproductionAreaSelection();
                const rs = new ReproductionSelection();
                const gds = new GreatestDistanceSelection();
                const gms = new GreatestMassSelection();
                expect(selectionMethodFormatter.deserialize("InsideReproductionAreaSelection")).toEqual(iras);
                expect(selectionMethodFormatter.deserialize("ReproductionSelection")).toEqual(rs);
                expect(selectionMethodFormatter.deserialize("GreatestDistanceSelection")).toEqual(gds);
                expect(selectionMethodFormatter.deserialize("GreatestMassSelection")).toEqual(gms);
        });
        describe('GreatestDistanceSelection', () => {
                const generationsWith = (creatures: { id: number, distanceCovered: number, isAlive: boolean }[], share = 0.05) => ({
                        worldController: { simData: { constants: { GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS: share } } },
                        currentCreatures: creatures,
                } as any);
                const creaturesWith = (distances: number[], alive = true) =>
                        distances.map((distanceCovered, id) => ({ id, distanceCovered, isAlive: alive }));

                test('keeps the share of living creatures that travelled furthest', () => {
                        const creatures = creaturesWith([...new Array(40)].map((_, i) => i));
                        const result = new GreatestDistanceSelection().getSurvivors(generationsWith(creatures));
                        expect(result.survivors.map((c: any) => c.distanceCovered)).toEqual([39, 38]);
                        expect(result.fitnessMaxValue).toBe(39);
                });
                test('leaves out dead creatures', () => {
                        const creatures = [...creaturesWith([5, 4]), ...creaturesWith([100], false)];
                        const result = new GreatestDistanceSelection().getSurvivors(generationsWith(creatures, 0.5));
                        expect(result.survivors.map((c: any) => c.distanceCovered)).toEqual([5]);
                        expect(result.fitnessMaxValue).toBe(5);
                });
                test('keeps at least one survivor in a small population', () => {
                        const result = new GreatestDistanceSelection().getSurvivors(generationsWith(creaturesWith([1, 3, 2])));
                        expect(result.survivors.map((c: any) => c.distanceCovered)).toEqual([3]);
                });
                test('returns no survivors and 0 with no living creatures', () => {
                        const result = new GreatestDistanceSelection().getSurvivors(generationsWith(creaturesWith([7], false)));
                        expect(result.survivors).toEqual([]);
                        expect(result.fitnessMaxValue).toBe(0);
                });
                test('breaks ties at random and keeps the list order', () => {
                        const creatures = creaturesWith(new Array(1000).fill(0));
                        const result = new GreatestDistanceSelection().getSurvivors(generationsWith(creatures));
                        const ids = result.survivors.map((c: any) => c.id);
                        expect(ids.length).toBe(50);
                        // not the first 50 of the list
                        expect(ids.some((id: number) => id >= 50)).toBe(true);
                        expect(creatures.map((c) => c.id)).toEqual([...new Array(1000).keys()]);
                });
        });
        test('GreatestMassSelection returns no survivors when there are no herbivores', () => {
                const generations = {
                        worldController: { simData: { constants: { GREATEST_MASS_SELECTION_TOP_SURVIVORS: 0.05 } } },
                        currentCreatures: [...new Array(40)].map(() => ({ _genus: "plant", mass: 1 })),
                        currentGen: 2,
                } as any;
                const result = new GreatestMassSelection().getSurvivors(generations);
                expect(result.survivors).toEqual([]);
                expect(result.fitnessMaxValue).toBe(0);
        });
});




