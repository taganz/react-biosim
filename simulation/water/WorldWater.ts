import { Grid, GridCell } from "../world/grid/Grid";
import { WaterData } from "@/simulation/water/WaterData";

/* 
    manages the water amount in the world (should be constant)
    stores water stats
*/

// thousands of creatures adding and taking water accumulate rounding errors
// (around 1e-7 after 25 generations of 1000 creatures); real accounting errors are much larger
const WATER_ROUNDING_TOLERANCE = 1e-4;

export default class WorldWater {

    waterData : WaterData;
    waterInCells : number = 0;
    waterInCloud : number;
    waterInCreatures : number = 0;
    maxRainWaterPerCell : number;
    _worldSize : number;    //TODO should use grid size?
    // since this world was made: water that fell from the cloud to the cells (rain and first rains),
    // and rains that did not fall because the cloud had too little water (for the log)
    rainedTotal : number = 0;
    rainsMissed : number = 0;

    constructor (worldSize: number, waterData : WaterData) {
        this.waterInCloud = worldSize * worldSize * waterData.waterTotalPerCell;
        this.maxRainWaterPerCell = waterData.waterRainMaxPerCell;
        this.waterData = waterData;
        this._worldSize = worldSize;
    }

    get totalWater() : number {
        return this.waterInCells + this.waterInCloud + this.waterInCreatures
    }

    reset() {
        this.waterInCloud = this._worldSize * this._worldSize * this.waterData.waterTotalPerCell;
        this.waterInCells = 0;
        this.waterInCreatures = 0;
        this.maxRainWaterPerCell = this.waterData.waterRainMaxPerCell;
        this.waterData = this.waterData;
    }

    // gets water from cell and gives it to creature
    getWaterFromCell (cell: GridCell, waterWanted: number): number {
        const waterGotFromCell = Math.min(waterWanted, cell.water);
        cell.water-=waterGotFromCell;
        this.waterInCells-= waterGotFromCell;
        this.waterInCreatures+=waterGotFromCell;
        return waterGotFromCell;
    }

    // when a creatures dies
    returnWaterToCellOrCloud (cell: GridCell, waterToReturn: number) {
        const waterReturnedToCell = Math.min(waterToReturn, cell.waterCapacity - cell.water);
        cell.water += waterReturnedToCell;
        this.waterInCells += waterReturnedToCell;
        this.waterInCloud += (waterToReturn - waterReturnedToCell);
        this.waterInCreatures -= waterToReturn;
    }

    // first generation creatures should get water from the environment
    getWaterFromCloud(waterWanted: number) {
        this.waterInCloud -= waterWanted;
        this.waterInCreatures += waterWanted;
        if (this.waterInCloud < 0 ) {  
            throw new Error (`getWaterFromCloud - not enough waterInCloud for first generation creature ${waterWanted.toFixed(2)}`)
        }
    }

    // the creatures were replaced without resetting the world water: the water of the old ones
    // goes back to the cloud and the mass of the new ones is taken from it
    replaceCreaturesWater(creaturesMass: number) {
        this.waterInCloud += this.waterInCreatures - creaturesMass;
        this.waterInCreatures = creaturesMass;
        if (this.waterInCloud < 0 ) {
            throw new Error (`replaceCreaturesWater - not enough waterInCloud for the new creatures ${creaturesMass.toFixed(2)}`)
        }
    }

    // creatures dissipate energy every step
    dissipateWater(water: number) {
        this.waterInCreatures -= water;
        this.waterInCloud += water;
        // rounding leaves a small negative value when creatures use up all their mass
        if (this.waterInCreatures < 0 && this.waterInCreatures > -WATER_ROUNDING_TOLERANCE) {
            this.waterInCloud += this.waterInCreatures;
            this.waterInCreatures = 0;
        }
        if (this.waterInCreatures < 0) {
            throw new Error (`dissipateWater - waterInCreatures < 0: ${water.toFixed(2)}`);
        }
    }
    // initialize grid water 
    // returns the water added to the cells
    firstRain(grid: Grid): number {
        let waterToAddPerCell = this.waterData.waterFirstRainPerCell;
        let waterToAddTotal = waterToAddPerCell * grid.size * grid.size;
        let waterAdded = 0;

        if (waterToAddTotal > this.waterInCloud ) {
            waterToAddPerCell = this.waterInCloud / grid.size / grid.size;
            waterToAddTotal = this.waterInCloud; 
            console.warn("WorldWater not enought water for firstRain. Adjusting waterDefaultPerCell from ", this.waterData.waterFirstRainPerCell.toFixed(2), " to ", waterToAddPerCell.toFixed(2));
        }
        for (let y = 0; y < grid._size; y++) {
            for (let x = 0; x < grid._size; x++) {
                waterAdded += grid.addWater([x, y], waterToAddPerCell); 
            }
        }
        this.waterInCloud -= waterAdded;
        this.waterInCells += waterAdded;
        this.rainedTotal += waterAdded;
        return waterAdded;
    }

    // the water of every cell, row by row: what cellWater() saves and restoreCells() puts back
    static cellWater(grid: Grid): number[] {
        const water: number[] = [];
        for (let y = 0; y < grid._size; y++) {
            for (let x = 0; x < grid._size; x++) {
                water.push(grid.cell(x, y).water);
            }
        }
        return water;
    }

    // instead of firstRain() when a run resumes: puts back the water the cells had, taken from the cloud.
    // Returns false and changes nothing if it does not fit this world (other size, or less water in total)
    restoreCells(grid: Grid, cellWater: number[]): boolean {
        if (cellWater.length !== grid._size * grid._size) return false;
        let total = 0;
        for (let i = 0; i < cellWater.length; i++) {
            total += Math.min(Math.max(0, cellWater[i]), grid.cell(i % grid._size, Math.floor(i / grid._size)).waterCapacity);
        }
        if (total > this.waterInCloud) return false;
        for (let i = 0; i < cellWater.length; i++) {
            const cell = grid.cell(i % grid._size, Math.floor(i / grid._size));
            cell.water = Math.min(Math.max(0, cellWater[i]), cell.waterCapacity);
        }
        this.waterInCloud -= total;
        this.waterInCells += total;
        return true;
    }

    // water from cloud go to cells
    // fraction scales the rain: continuous runs rain every step with 1 / steps per generation
    //TODO functions....
    // returns the water added to the cells, or null when the cloud has too little for the rain and it does not rain
    rain(grid: Grid, fraction: number = 1): number | null {

        const rainValue = this.waterData.waterRainMaxPerCell * fraction;
        // if not enough water to do uniform rain, don't do rain at all
        if (rainValue * this._worldSize * this._worldSize 
            > this.waterInCloud ) {
                this.rainsMissed++;
                return null;
        }
        let rained = 0;

        // continuous runs rain every step, so the loop avoids closures, arrays and repeated sines.
        // The amount of each cell is computed as before: (rainValue * sin x) * sin y
        const rainType = this.waterData.rainType;
        let sines: Float64Array | null = null;
        switch(rainType) {
            case "rainTypeSinSin":
                sines = this.rainSines(grid._size);
                break;
            case "rainTypeUniform":
            case "rainTypeUniformNE":
                break;
            default:
                throw new Error ("unknown rainType: ".concat(rainType as string));
            }
        const half = grid.size * 0.5;
        const cells = grid._grid;
        for (let y = 0; y < grid._size; y++) {
            for (let x = 0; x < grid._size; x++) {
                let waterToAdd: number;
                if (sines !== null) waterToAdd = rainValue * sines[x] * sines[y];
                else if (rainType === "rainTypeUniform") waterToAdd = rainValue;
                else waterToAdd = (x > half && y < half) ? rainValue : (rainValue * 0.5);
                waterToAdd = Math.min(waterToAdd, this.waterInCloud);
                // same as grid.addWater
                const cell = cells[x][y];
                const waterAdded = Math.min(waterToAdd, cell.waterCapacity - cell.water);
                cell.water += waterAdded;
                this.waterInCloud-=waterAdded;
                this.waterInCells+=waterAdded;
                rained += waterAdded;
                if (this.waterInCloud <= 0) {
                    this.rainedTotal += rained;
                    return rained;
                }
            }
        }
        this.rainedTotal += rained;
        return rained;
    }

    // sin(PI * i / size) for every row or column, computed once per world size
    private _rainSines: Float64Array | null = null;
    private rainSines(size: number): Float64Array {
        if (this._rainSines === null || this._rainSines.length !== size) {
            this._rainSines = new Float64Array(size);
            for (let i = 0; i < size; i++) {
                this._rainSines[i] = Math.sin(Math.PI * i/size);
            }
        }
        return this._rainSines;
    }

    // attack_plant some water from cells to clouds to redistribute it
    evaporation(grid: Grid) {
        let accumWaterToEvaporate = 0;
        for (let y = 0; y < grid._size; y++) {
            for (let x = 0; x < grid._size; x++) {
                const cell = grid.cell(x,y);
                let waterToEvaporateCell = this.waterData.waterEvaporationPerCellPerGeneration < cell.water 
                            ? this.waterData.waterEvaporationPerCellPerGeneration
                            : cell.water;
                cell.water -= waterToEvaporateCell;
                accumWaterToEvaporate += waterToEvaporateCell;
            }
        }
        this.waterInCloud+=accumWaterToEvaporate;
        this.waterInCells-=accumWaterToEvaporate;
    }
}