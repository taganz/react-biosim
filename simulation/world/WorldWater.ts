import { Grid, GridPosition, GridCell } from "./grid/Grid";
import { WORLD_WATER_RAIN_MAX_VALUE,
         WORLD_WATER_EVAPORATION_PER_GENERATION
        } from "@/simulation/simulationConstants";


/* 
    manages the water amount in the world (should be constant)
    stores water stats
*/

export type RainType = "rainTypeSinSin" | "rainTypeUniform";

export default class WorldWater {

    waterInCells : number = 0;
    waterInCloud : number;
    waterInCreatures : number = 0;
    maxRainWaterPerCell : number;

    //TODO revisar els casos on es demana mes aigua de la que hi ha...
    constructor (initialTotalWater: number, maxRainWaterPerCell: number = WORLD_WATER_RAIN_MAX_VALUE) {
        this.waterInCloud = initialTotalWater;
        this.maxRainWaterPerCell = maxRainWaterPerCell;
    }

    get totalWater() : number {
        return this.waterInCells + this.waterInCloud + this.waterInCreatures
    }

    // gets water from cell and gives it to creature
    getWaterFromCell (cell: GridCell, waterWanted: number): number {
        const waterGotFromCell = waterWanted < cell.water ? waterWanted : cell.water;
        cell.water-=waterGotFromCell;
        this.waterInCells-= waterGotFromCell;
        this.waterInCreatures+=waterGotFromCell;
        return waterGotFromCell;
    }

    // when a creatures dies
    returnWaterToCell (cell: GridCell, waterAddToCell: number) {
        cell.water += waterAddToCell;
        this.waterInCells += waterAddToCell;
        this.waterInCreatures -= waterAddToCell;
    }

    // creatures dissipate energy every step
    dissipateWater(water: number) {
        this.waterInCells -= water;
        this.waterInCloud += water;

    }
    // initialize grid water 
    firstRain(grid: Grid, waterDefaultPerCell: number) {
        let waterToAddPerCell = waterDefaultPerCell;
        let waterToAddTotal = waterToAddPerCell * grid.size * grid.size;

        if (waterToAddTotal > this.waterInCloud ) {
            waterToAddPerCell = this.waterInCloud / grid.size / grid.size;
            waterToAddTotal = this.waterInCloud; 
            console.warn("WorldWater not enought water for firsRain. Adjusting waterDefaultPerCell ",waterToAddPerCell.toFixed(2));
        }
        grid.waterDefault = waterToAddPerCell;
        this.waterInCloud -= waterToAddTotal;
        this.waterInCells += waterToAddTotal;
    }

    // water from cloud go to cells
    //TODO functions....
    rain(grid: Grid, rainFunction : RainType = "rainTypeUniform") {
        let rf;
        switch(rainFunction) {
            case "rainTypeSinSin":
                rf = ((x: number, y: number) => 
                    this.maxRainWaterPerCell * Math.sin(Math.PI * x/grid._size) * Math.sin(Math.PI * y/grid._size));
                break;
            case "rainTypeUniform":
                 rf = ( (x: number, y: number) => this.maxRainWaterPerCell);
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
                let waterToEvaporateCell = WORLD_WATER_EVAPORATION_PER_GENERATION < cell.water 
                            ? WORLD_WATER_EVAPORATION_PER_GENERATION 
                            : cell.water;
                cell.water -= waterToEvaporateCell;
                accumWaterToEvaporate += waterToEvaporateCell;
            }
        }
        this.waterInCloud+=accumWaterToEvaporate;
        this.waterInCells-=accumWaterToEvaporate;
    }
}