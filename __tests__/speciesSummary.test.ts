import Creature from "@/simulation/creature/Creature";
import Genome from "@/simulation/creature/brain/Genome";
import { Species } from "@/simulation/creature/Species";
import { SimulationData } from "@/simulation/SimulationData";
import { summarizeLoadedSpecies } from "@/simulation/creature/speciesSummary";

// only the species and genomes are read, so the rest of the data is left out
const withSpecies = (species?: Species[], startGenomes?: Genome[]) =>
  ({ species, startGenomes }) as unknown as SimulationData;
const fakeCreatures = (count: number) => new Array(count).fill({}) as Creature[];

describe('summarizeLoadedSpecies', () => {

    test('orders the species by creatures and gives their share', () => {
        const data = withSpecies([
            new Species(new Genome([1]), fakeCreatures(1)),
            new Species(new Genome([2]), fakeCreatures(3)),
        ]);
        const summary = summarizeLoadedSpecies(data);
        expect(summary.totalCreatures).toEqual(4);
        expect(summary.totalSpecies).toEqual(2);
        expect(summary.top.map((s) => s.genome.genes)).toEqual([[2], [1]]);
        expect(summary.top.map((s) => s.percentage)).toEqual([75, 25]);
    });

    test('keeps only the first ones, but counts every creature', () => {
        const data = withSpecies([1, 2, 3, 4].map((gene) => new Species(new Genome([gene]), fakeCreatures(gene))));
        const summary = summarizeLoadedSpecies(data, 2);
        expect(summary.top.map((s) => s.creatures)).toEqual([4, 3]);
        expect(summary.top[0].percentage).toEqual(40);
        expect(summary.totalSpecies).toEqual(4);
    });

    test('groups the genomes of a file saved at the start of a generation', () => {
        const data = withSpecies(undefined, [new Genome([5]), new Genome([7]), new Genome([5])]);
        const summary = summarizeLoadedSpecies(data);
        expect(summary.top.map((s) => [s.genome.genes[0], s.creatures])).toEqual([[5, 2], [7, 1]]);
    });

    test('leaves out the species under 1% and counts them in the rest', () => {
        const data = withSpecies([
            new Species(new Genome([1]), fakeCreatures(195)),
            new Species(new Genome([2]), fakeCreatures(3)),
            new Species(new Genome([3]), fakeCreatures(1)),
            new Species(new Genome([4]), fakeCreatures(1)),
        ]);
        const summary = summarizeLoadedSpecies(data);
        expect(summary.top.map((s) => s.creatures)).toEqual([195, 3]);
        expect(summary.rest).toEqual({ species: 2, creatures: 2, percentage: 1 });
    });

    test('a setup has no creatures', () => {
        const summary = summarizeLoadedSpecies(withSpecies());
        expect(summary).toEqual({
            totalCreatures: 0, totalSpecies: 0, top: [], rest: { species: 0, creatures: 0, percentage: 0 },
        });
    });
})
