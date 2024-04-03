import Creature from "../../creature/Creature";
import WorldObject from "../WorldObject";

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

    constructor(size: number) {
        this._grid = [];
        this._size = size;
    }


    public addRow(row: GridCell[]) : void {
        this._grid.push(row);
    }

    public clear() {
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

    public getRandomPosition(): [number, number] {
        return [
          Math.floor(Math.random() * this._size),
          Math.floor(Math.random() * this._size),
        ];
      }

    public isTileEmpty(x: number, y: number): boolean {
        // for (let i = 0; i < this.currentCreatures.length; i++) {
        //   const creature = this.currentCreatures[i];
        //   if (creature.isAlive && creature.position[0] === x && creature.position[1] === y) {
        //     return false;
        //   }
        // }
        // return true;
    
        const cell = this._grid[x][y];
        return !this._grid[x][y].creature && !cell.isSolid;
      }
    
       
  public getRandomAvailablePositionDeepCheck(
    creatures: Creature[]): [number, number] {

    // Generate a position until it corresponds to an empty tile
    let position: [number, number];
    do {
      position = this.getRandomPosition();
    } while (!this.isTileEmptyDeepCheck(creatures, position[0], position[1]));

    return position;
  }
  
    /*
    public getRandomAvailablePosition() {
        // Generate a position until it corresponds to an empty tile
        // --> falta controlar bucle infinit
        let position: [number, number];
        do {
          position = this.getRandomPosition();
        } while (!this._grid.isTileEmpty(position[0], position[1]));
    
        return position;
      }
      */
    

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

  
  // RD --> podria fer check de solid al principi i retornar false!
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


}