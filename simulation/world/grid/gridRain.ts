import {Grid} from "./Grid";
import {RAIN_MAX_VALUE} from "@/simulation/simulationConstants";


export default function gridRain(grid: Grid) {
    const sinSin = ( (x: number, y: number) => Math.sin(Math.PI * x/grid._size) * Math.sin(Math.PI * y/grid._size));
    const uniform = ( (x: number, y: number) => 1);
    for (let y = 0; y < grid._size; y++) {
        for (let x = 0; x < grid._size; x++) {
            grid.addWater([x, y], RAIN_MAX_VALUE * sinSin(x,y));
        }
      }


}