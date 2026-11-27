import { SimulationData } from "@/simulation/SimulationData";

export interface WaterSettingsCheck {
    /** the run cannot start with these settings */
    errors: string[];
    /** the run starts, but the water does not behave as the settings say */
    warnings: string[];
}

const format = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2);

/**
 * Checks the water settings against the world size and the first generation, which takes its mass
 * from the total water before the first rain. Which genera the first generation has depends on the
 * population strategy, so the check uses the smallest mass at birth for errors and the largest for warnings.
 */
export function checkWaterSettings(sim: SimulationData): WaterSettingsCheck {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { size, MASS_AT_BIRTH_PLANT, MASS_AT_BIRTH_ATTACK_PLANT } = sim.worldControllerData;
    const { waterTotalPerCell, waterFirstRainPerCell, waterCellCapacity, waterRainMaxPerCell } = sim.waterData;
    const population = sim.worldGenerationsData.initialPopulation;
    const cells = size * size;
    const total = cells * waterTotalPerCell;
    const masses = [MASS_AT_BIRTH_PLANT, MASS_AT_BIRTH_ATTACK_PLANT];
    const minimumNeed = population * Math.min(...masses);
    const maximumNeed = population * Math.max(...masses);

    if (minimumNeed > total) {
        errors.push(`The first generation needs at least ${format(minimumNeed)} water (${population} creatures × the smallest mass at birth), `
            + `but the world has ${format(total)} (${size}² cells × Total water per cell). `
            + "Raise Total water (per cell), or lower the initial population or the masses at birth.");
    } else if (maximumNeed > total) {
        warnings.push(`The first generation can need up to ${format(maximumNeed)} water (${population} creatures × the largest mass at birth), `
            + `but the world has ${format(total)}. If most creatures are of the heavier genera, the run will not start.`);
    }
    if (errors.length === 0) {
        const leftForCells = Math.max(0, total - minimumNeed);
        if (waterFirstRainPerCell * cells > leftForCells) {
            warnings.push(`Initial water per cell is more than what the first generation leaves: the cells will start with at most `
                + `${format(leftForCells / cells)} each.`);
        }
    }
    if (waterFirstRainPerCell > waterCellCapacity) {
        warnings.push(`Initial water per cell is above Cell water capacity: the cells will start with at most ${format(waterCellCapacity)}.`);
    }
    // a generational run rains a whole generation at once, and only when the cloud has it for every cell
    if (sim.worldGenerationsData.simulationType !== "continuous" && waterRainMaxPerCell > waterTotalPerCell) {
        warnings.push("Rain max per cell is above Total water (per cell): the cloud can never hold enough water, so it will never rain.");
    }
    return { errors, warnings };
}
