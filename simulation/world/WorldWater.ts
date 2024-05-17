import { Grid, GridPosition, GridCell } from "./grid/Grid";
import { WaterData } from "./WorldControllerData";

/* 
    manages the water amount in the world (should be constant)
    stores water stats
*/

export type RainType = "rainTypeSinSin" | "rainTypeUniform";

export default class WorldWater {

    waterData : WaterData;
    waterInCells : number = 0;
    waterInCloud : number;
    waterInCreatures : number = 0;
    maxRainWaterPerCell : number;
    _worldSize : number;

    //TODO revisar els casos on es demana mes aigua de la que hi ha...
    constructor (worldSize: number, waterData : WaterData) {
        this.waterInCloud = worldSize * worldSize * waterData.waterTotalPerCell;
        this.maxRainWaterPerCell = waterData.waterRainMaxPerCell;
        this.waterData = waterData;
        this._worldSize = worldSize;
    }

    get totalWater() : number {
        return this.waterInCells + this.waterInCloud + this.waterInCreatures
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
    returnWaterToCell (cell: GridCell, waterToReturn: number) {
        const waterReturnedToCell = Math.min(waterToReturn, cell.waterCapacity - cell.water);
        cell.water += waterReturnedToCell;
        this.waterInCells += waterReturnedToCell;
        this.waterInCreatures -= waterReturnedToCell;
    }

    // creatures dissipate energy every step
    dissipateWater(water: number) {
        this.waterInCells -= water;
        this.waterInCloud += water;

    }
    // initialize grid water 
    firstRain(grid: Grid) {
        let waterToAddPerCell = this.waterData.waterFirstRainPerCell;
        let waterToAddTotal = waterToAddPerCell * grid.size * grid.size;
        let waterAdded = 0;

        if (waterToAddTotal > this.waterInCloud ) {
            waterToAddPerCell = this.waterInCloud / grid.size / grid.size;
            waterToAddTotal = this.waterInCloud; 
            console.warn("WorldWater not enought water for firsRain. Adjusting waterDefaultPerCell from ", this.waterData.waterFirstRainPerCell.toFixed(2), " to ", waterToAddPerCell.toFixed(2));
        }
        for (let y = 0; y < grid._size; y++) {
            for (let x = 0; x < grid._size; x++) {
                waterAdded += grid.addWater([x, y], waterToAddPerCell); 
            }
        }
        this.waterInCloud -= waterAdded;
        this.waterInCells += waterAdded;
    }

    // water from cloud go to cells
    //TODO functions....
    rain(grid: Grid, rainFunction : RainType = "rainTypeUniform", rainValue = this.maxRainWaterPerCell) {
        let rf;
        switch(rainFunction) {
            case "rainTypeSinSin":
                rf = ((x: number, y: number) => 
                    rainValue * Math.sin(Math.PI * x/grid._size) * Math.sin(Math.PI * y/grid._size));
                break;
            case "rainTypeUniform":
                 rf = ( (x: number, y: number) => rainValue);
                 break;
            default:
                throw new Error ("unknown rainType");
            }
        for (let y = 0; y < grid._size; y++) {
            for (let x = 0; x < grid._size; x++) {
                let waterToAdd =  rf(x,y);
                waterToAdd = Math.min(waterToAdd, this.waterInCloud);
                const waterAdded = grid.addWater([x, y], waterToAdd);
                this.waterInCloud-=waterAdded;
                this.waterInCells+=waterAdded;
                if (this.waterInCloud <= 0) {
                    return;
                }
            }
        }
    }

    // move some water from cells to clouds to redistribute it
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