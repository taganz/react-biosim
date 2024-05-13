import { Grid, GridPosition, GridCell } from "./grid/Grid";
import { WORLD_WATER_RAIN_MAX_VALUE,
         WORLD_WATER_EVAPORATION_PER_GENERATION
        } from "@/simulation/simulationConstants";


/* 
    manages the water amount in the world (should be constant)
    stores water stats
*/
export default class WorldWater {

    waterInCells : number = 0;
    waterInCloud : number;
    waterInCreatures : number = 0;

    constructor (initialTotalWater: number) {
        this.waterInCloud = initialTotalWater;
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

    // initialize grid water 
    firstRain(grid: Grid, waterDefaultPerCell: number) {
        const totalDefaultWater =  waterDefaultPerCell * grid.size * grid.size;

        if (totalDefaultWater > this.totalWater ) {
            throw new Error ("firstRain invalid water per cell");
            return;
        }
        grid.waterDefault = waterDefaultPerCell;
        this.waterInCloud -= totalDefaultWater;
        this.waterInCells += totalDefaultWater;
    }

    // water from cloud go to cells
    //TODO functions....
    rain(grid: Grid) {
        const rainFunctionSinSin = ( (x: number, y: number) => Math.sin(Math.PI * x/grid._size) * Math.sin(Math.PI * y/grid._size));
        const rainFunctionUniform = ( (x: number, y: number) => 1);
        for (let y = 0; y < grid._size; y++) {
            for (let x = 0; x < grid._size; x++) {
                let waterToAdd = WORLD_WATER_RAIN_MAX_VALUE * rainFunctionSinSin(x,y);
                waterToAdd = waterToAdd > this.waterInCloud ? waterToAdd : this.waterInCloud;
                this.waterInCloud-=waterToAdd;
                this.waterInCells+=waterToAdd;
                grid.addWater([x, y], waterToAdd);
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