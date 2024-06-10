//import { max } from "d3";
import WorldGenerations from "@/simulation/generations/WorldGenerations";
import Creature from "../../creature/Creature";
import WorldObject from "../objects/WorldObject";
import {Direction, Direction4} from '@/simulation/world/direction';
import shuffle from "lodash.shuffle";
import { geneArrayToString } from "@/simulation/creature/brain/Genome";


export type GridCell = {
    creature: Creature | null;
    objects: WorldObject[];
    isSolid: boolean;
    water: number;   // the amount of water the cell holds
    waterCapacity : number;  // the amount of water the cell can hold
  };

 
export type GridPosition = [number, number];

// export type Grid = Array<Array<GridPoint>>;

export class Grid { 
    
  _grid : Array<Array<GridCell>>;
  _size : number;
  _objects : WorldObject[];

  constructor(size: number, objects: WorldObject[], cellWaterCapacityDefault: number) {
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
        row.push({ creature: null, objects: [], isSolid: false, water: 0, waterCapacity: cellWaterCapacityDefault});
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
    //console.log("grid initialized");
  }

  /*
  set waterDefault(waterDefault: number) {
    this._grid.forEach(row => row.forEach(cell => cell.water = waterDefault));
  }
  */
  public addWater(position: GridPosition, water: number) : number {
    const cell = this.cell(position[0], position[1]);
    let waterToAdd = Math.min(water, cell.waterCapacity-cell.water);
    cell.water+= waterToAdd;
    return waterToAdd;
  }
  /*
  public getWater(position: GridPosition, water: number) : number {
    const cell = this.cell(position[0], position[1]);
    let waterToGet = Math.max(water, cell.water);
    cell.water-= waterToGet;
    return waterToGet;
  }
  */
  
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
  public addCreature(creature : Creature) : boolean {
    if (!this.isTileEmpty(creature.position[0], creature.position[1])) {
        // when doing map hot change the position could be no longuer available
        return false;
      }
    this._grid[creature.position[0]][creature.position[1]].creature = creature;
    return true;
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

  public updateCreatures(creatures : Creature[]) {
    this.clearCreatures();
    for (let i=0; i<creatures.length; i++) {
      this.addCreature(creatures[i]);
    }


  }

  public cell(x: number, y: number) : GridCell {
      return this._grid[x][y];
  } 
  public cellOffsetDirection4(position: GridPosition, offset: Direction4) : GridPosition | null{
    const cells : [number, number, Direction4][]
    = ([[0, 1, "S"], [1, 0, "E"], [-1, 0, "W"], [0, -1, "N"]]);

    for (let i = 0; i < cells.length; i++) {
      if (cells[i][2] === offset) {
          const [x1, y1] = [position[0]+cells[i][0], position[1]+cells[i][1]];
          if (this.isTileInsideWorld(x1, y1)) {   
            return [x1, y1];
          }
      }
    }
    return null;
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

  public getNeighbour4Creature(position: GridPosition) : Direction4 {
      const cells : [number, number, Direction4][]
        = shuffle([[0, 1, "S"], [1, 0, "E"], [-1, 0, "W"], [0, -1, "N"]]);
      
      for (let i = 0; i<4; i++) {
        const c : [number, number]= [cells[i][0], cells[i][1]];
        const [x, y] = [position[0]+c[0], position[1]+c[1]]; 
        if (this.isTileInsideWorld(x,y)) {
          if (this.cell(x, y).creature!=null) {
            return cells[i][2];
          }
        }
      }
      return null;
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

 
public debugPrintGridCreatures(maxColumns = 10) {
  let grid : string = "";
  for (let y=0; y < Math.min(this._grid.length, maxColumns); y++) {
    let row : string = "";
    for (let x=0; x < Math.min(this._grid.length, maxColumns); x++) {
      const cell = this.cell(x,y);
      row += cell.creature ? "o" : (cell.isSolid ? "x" : ".");
    } 
    grid += row.concat("\n") ;
  }
  console.log(grid);

}

public debugGetGridWater() : number {
  let accumWater = 0;
  for (let y=0; y < this._grid.length; y++) {
    let row : string = "";
    for (let x=0; x < this._grid.length; x++) {
      accumWater += this.cell(x,y).water;
    } 
  }
  return accumWater;
}

public debugPrintWater(maxColumns=10) {
  let grid : string = "";
  for (let y=0; y < Math.min(this._grid.length, maxColumns); y++) {
    let row : string = "";
    for (let x=0; x < Math.min(this._grid.length, maxColumns); x++) {
      const cell = this.cell(x,y);
      row += cell.water.toFixed(1);
      row += " ";
    } 
    grid += row.concat("\n") ;
  }
  console.log(grid);
}

public debugPrintCreatures(generations : WorldGenerations, maxColumns = 10) {
  let grid : string = "";
  for (let y=0; y < Math.min(this._grid.length, maxColumns); y++) {
    let row : string = "";
    for (let x=0; x < Math.min(this._grid.length, maxColumns); x++) {
      const cell = this.cell(x,y);
      if (cell.creature) {
        row += x.toString() + ", " + y.toString() + ": " + cell.creature.genus +"\n";
        //row += geneArrayToString(generations, cell.creature.brain.genome.genes);   
      }
     } 
    grid += row;
  }
  console.log(grid);

}

public creatureCount() : number {
  return this._grid.map(row => 
    row.reduce((count, cell) => count + (cell.creature != null  ? 1 : 0), 0) // Contar en cada fila
  ).reduce((total, current) => total + current, 0); // Sumar todos los conteos de las filas
}



}