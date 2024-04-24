//import { max } from "d3";
import Creature from "../../creature/Creature";
import WorldObject from "../objects/WorldObject";
import * as constants from "@/simulation/simulationConstants"

export type GridCell = {
    creature: Creature | null;
    objects: WorldObject[];
    isSolid: boolean;
    water: number;
    energy: number;
  };

 
export type GridPosition = [number, number];

// export type Grid = Array<Array<GridPoint>>;

export class Grid { 
    
  _grid : Array<Array<GridCell>>;
  _size : number;
  _objects : WorldObject[];

  constructor(size: number, objects: WorldObject[]) {
    this._grid = [];
    this._size = size;

    // Generate pixels of objects
    this._objects = objects;
    for (let i = 0; i < this._objects.length; i++) {
      this._objects[i].computePixels(this._size);
    }

    // create grid initializing with empty cells
    for (let y = 0; y < this._size; y++) {
      const row: Array<GridCell> = [];
      for (let x = 0; x < this._size; x++) {
        row.push({ creature: null, objects: [], isSolid: false, water: constants.WATER_GRIDPOINT_DEFAULT, energy: constants.ENERGY_GRIDPOINT_DEFAULT });
      }
      this.addRow(row);
    }

    // Check objects
    for (
      let objectIndex = 0;
      objectIndex < this._objects.length;
      objectIndex++
    ) {
      const obj = this._objects[objectIndex];

      for (let pixelIdx = 0; pixelIdx < obj.pixels.length; pixelIdx++) {
        const [x, y] = obj.pixels[pixelIdx];
        // Set pixel
        //this._grid[x][y].objects.push(obj);
        this._grid[x][y].objects.push(obj);
        // Is it solid?
        if (obj.areaType === undefined) {
          this._grid[x][y].isSolid = true;
        }
      }
    }
    console.log("grid initialized");
  }

  get size() : number {
    return this._size;
  }
  get objects() : WorldObject[] {
    return this._objects;
  }
  public addRow(row: GridCell[]) : void {
      this._grid.push(row);
  }

  // add a creature at its position.
  public addCreature(creature : Creature) : void {
    if (!this.isTileEmpty(creature.position[0], creature.position[1])) {
        throw new Error ("addCreature tile not available ".concat(creature.position.toString()));
        //console.error("addCreature tile not available ".concat(creature.position.toString()), " creature id in cell:", this._grid[creature.position[0]][creature.position[1]].creature?.id);
      }
    this._grid[creature.position[0]][creature.position[1]].creature = creature;
  }

  public removeCreature(creature: Creature) : void {
    const cell = this._grid[creature.position[0]][creature.position[1]];
    if (cell.creature == null) {
      throw new Error("removeCreature position.creature == null");
    }
    cell.creature = null;
  }

  // clear creatures, keep other values
  public clearCreatures() {
      for (let y = 0; y < this._size; y++) {
        for (let x = 0; x < this._size; x++) {
          const point = this._grid[x][y];
          point.creature = null;
          // point.obstacle = null;
          // point.areas = [];
        }
      }
  }

  public cell(x: number, y: number) : GridCell {
      return this._grid[x][y];
  } 

  public cellByPos(pos: GridPosition) : GridCell {
      return this._grid[pos[0]][pos[1]];
  } 

  public clamp(x: number, y: number): GridPosition {
      const clampedX = Math.min(Math.max(x, 0), this._size-1);
      const clampedY = Math.min(Math.max(y, 0), this._size-1);
      return [clampedX, clampedY];
  }

  public isTileInsideWorld(x: number, y: number): boolean {
      if (x < 0 || y < 0 || x >= this._size || y >= this._size) {
          return false;
      }
      return true;
  }

  //TODO not testing x, y inside worldController!
  public isTileEmpty(x: number, y: number): boolean {  
    const cell = this._grid[x][y];
    return !this._grid[x][y].creature && !cell.isSolid;
  }

  public getRandomPosition(): [number, number] {
      return [
        Math.floor(Math.random() * this._size),
        Math.floor(Math.random() * this._size),
      ];
    }

  // Generate a position until it corresponds to an empty tile
  public getRandomAvailablePosition() : GridPosition | null {
    let position: GridPosition;
    // Generate a random starting position
    const startX = Math.floor(Math.random() * this._size);
    const startY = Math.floor(Math.random() * this._size);

    // Iterate over the array starting from the random position
    for (let x = startX; x < startX + this._size; x++) {
        for (let y = startY; y < startY + this._size; y++) {
          // Adjust x and y to wrap around the array
          position = [x % this._size, y % this._size];
          if (this.isTileEmpty(position[0], position[1])) {
            return position;
          }
        }
      }
      return null;
  }



  public getCenteredAvailablePosition(x: number, y: number, hw: number, hh: number, initialPopulation : number): [number, number] {
    // Generate a position until it corresponds to an empty tile
    let position: [number, number];
    let hw2 : number = hw;
    let hh2 : number = hh;
    // if population doesn't fit inside the spawn area, make area bigger
    // note: won't work well if rectangle is partially outside the canvas?
    if (hw2 * hh2 * 4 < initialPopulation * 1.3) {
        hw2 = Math.sqrt(initialPopulation * hw2 / hh2);
        hh2 = Math.sqrt(initialPopulation * hh2 / hw2);
    }
    let warning = initialPopulation * 1.5; // basic infinite loop prevention
    do {
      if (warning-- == 0) {
        console.warn("getCenteredAvailablePositionDeepCheck -- warning == 0", hw2, hh2, initialPopulation);
        hw2 *= 1.3;
        hh2 *= 1.3;
        warning = initialPopulation * 1.5;
      }
      position = [
        Math.floor(x + (Math.random() * 2 - 1) * hw2),
        Math.floor(y + (Math.random() * 2 - 1) * hh2),
      ];
      position = this.clamp(position[0], position[1]);
      //console.log("warning: ", warning, "position ", position);
    } while (!this.isTileEmpty(position[0], position[1]));

    return position;
  }



  public getNearByAvailablePosition(x: number, y: number): [number, number] | null {
    const directions = [[-1, 0], [-1, 1],[1, -1],[1, 1],[-1, -1], [1, 0], [0, -1], [0, 1]].sort(() => Math.random() - 0.5);; // Possible directions

    for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;

        // Check if the new position is within the grid bounds
        if (newX >= 0 && newX < this._grid.length && newY >= 0 && newY < this._grid[0].length) {
            // Check if the cell is free
            if (this.isTileEmpty(newX, newY)) {
                return [newX, newY]; // Return the position of the free cell
            }
        }
    }

    return null; // Return null if no free cell is found nearby
}

public debugPrint(maxColumns = 10) {
  let grid : string = "";
  for (let x=0; x < Math.min(this._grid.length, maxColumns); x++) {
    let row : string = "";
    for (let y=0; y < Math.min(this._grid.length, maxColumns); y++) {
      const cell = this.cell(x,y);
      row += cell.creature ? "o" : (cell.isSolid ? "x" : ".");
    } 
    grid += row.concat("\n") ;
  }
  console.log(grid);

}
  /*
  public getRandomAvailablePositionDeepCheck(
    creatures: Creature[]): [number, number] {

    // Generate a position until it corresponds to an empty tile
    let position: [number, number];
    do {
      position = this.getRandomPosition();
    } while (!this.isTileEmptyDeepCheck(creatures, position[0], position[1]));

    return position;
  }
  */
   
  /*

  // RD  
  // --> initialPopulation aqui?
  public getCenteredAvailablePositionDeepCheck(creatures: Creature[], x: number, y: number, hw: number, hh: number, initialPopulation : number): [number, number] {
    // Generate a position until it corresponds to an empty tile
    let position: [number, number];
    let hw2 : number = hw;
    let hh2 : number = hh;
    // if population doesn't fit inside the spawn area, make area bigger
    // note: won't work well if rectangle is partially outside the canvas?
    if (hw2 * hh2 * 4 < initialPopulation * 1.3) {
        hw2 = Math.sqrt(initialPopulation * hw2 / hh2);
        hh2 = Math.sqrt(initialPopulation * hh2 / hw2);
    }
    let warning = initialPopulation * 1.5; // basic infinite loop prevention
    do {
      if (warning-- == 0) {
        console.warn("getCenteredAvailablePositionDeepCheck -- warning == 0", hw2, hh2, initialPopulation);
        hw2 *= 1.3;
        hh2 *= 1.3;
        warning = initialPopulation * 1.5;
      }
      position = [
        Math.floor(x + (Math.random() * 2 - 1) * hw2),
        Math.floor(y + (Math.random() * 2 - 1) * hh2),
      ];
      position = this.clamp(position[0], position[1]);
      //console.log("warning: ", warning, "position ", position);
    } while (!this.isTileEmptyDeepCheck(creatures, position[0], position[1]));

    return position;
  }

  */
  // RD --> podria fer check de solid al principi i retornar false!
  /*
  public isTileEmptyDeepCheck(
    creatures: Creature[],
    x: number,
    y: number
  ): boolean {
    let hasCreature = false;

    for (let i = 0; i < creatures.length; i++) {
      const creature = creatures[i];
      if (
        creature.isAlive &&
        creature.position[0] === x &&
        creature.position[1] === y
      ) {
        hasCreature = true;
        break;
      }
    }

    const gridPoint = this._grid[x][y];
    return !hasCreature && !gridPoint.isSolid;
  }
*/

}