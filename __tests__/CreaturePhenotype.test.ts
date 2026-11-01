import CreaturePhenothype from "@/simulation/creature/CreaturePhenothype";
import Genome from "@/simulation/creature/brain/Genome";

const hueOf = (color: string): number => {
    const match = color.match(/^hsl\((\d+), \d+%, \d+%\)$/);
    if (!match) throw new Error(`not an hsl colour: ${color}`);
    return Number(match[1]);
};

// well spread hashes, plus the limits of the 32 bit range
const sampleHashes = (): number[] => {
    const hashes = [0, 0xFFFFFFFF];
    for (let gene = 0; gene < 5000; gene++) hashes.push(new Genome([gene]).getHash());
    return hashes;
};

describe('CreaturePhenotype', () => {
    test('green plants mode gives plants only green hues', () => {
        for (const hash of sampleHashes()) {
            const hue = hueOf(CreaturePhenothype.greenPlantsColorAssign("plant", hash));
            expect(hue).toBeGreaterThanOrEqual(95);
            expect(hue).toBeLessThanOrEqual(140);
        }
    });

    test.each(["attack_plant", "attack_animal", "unknown"] as const)(
        'green plants mode never gives green hues to %s',
        (genus) => {
            for (const hash of sampleHashes()) {
                const hue = hueOf(CreaturePhenothype.greenPlantsColorAssign(genus, hash));
                expect(hue).toBeGreaterThanOrEqual(0);
                expect(hue).toBeLessThan(360);
                expect(hue >= 70 && hue <= 170).toBe(false);
            }
        }
    );

    test('green plants mode uses both sides of the excluded hues', () => {
        const hues = sampleHashes().map((hash) => hueOf(CreaturePhenothype.greenPlantsColorAssign("attack_animal", hash)));
        expect(hues.some((hue) => hue < 70)).toBe(true);
        expect(hues.some((hue) => hue > 170)).toBe(true);
    });

    test('genomes that differ in one gene get different colours', () => {
        const base = [0x12345678, 0x0ABCDEF0, 0x7FFFFFFF];
        const colors = new Set<string>();
        for (let i = 0; i < 100; i++) {
            const genome = new Genome([...base, base[0] + i]);
            colors.add(CreaturePhenothype.greenPlantsColorAssign("attack_animal", genome.getHash()));
        }
        expect(colors.size).toBeGreaterThan(90);
    });

    test('the same genome always gets the same hash', () => {
        expect(new Genome([1, 2, 3]).getHash()).toBe(new Genome([1, 2, 3]).getHash());
        expect(new Genome([1, 2, 3]).getHash()).not.toBe(new Genome([3, 2, 1]).getHash());
    });
})
