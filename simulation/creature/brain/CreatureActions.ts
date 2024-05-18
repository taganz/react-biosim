import Creature from "../Creature";
import * as constants from "../../simulationConstants"
import {Direction, Direction4} from '@/simulation/world/direction';
import { GridPosition } from "@/simulation/world/grid/Grid";


// --> revisar. per evitar tenir-ho repetit a worldAtoms
export type ActionName =
  | "MoveNorth"
  | "MoveSouth"
  | "MoveEast"
  | "MoveWest"
  | "RandomMove"
  | "MoveForward"
  | "Photosynthesis"
  | "Reproduction"
  | "Attack";

export type Action = {
  name: ActionName;
  enabled: boolean;
  family: "move" | "attack" | "basic"
};


//export type Actions = Record<ActionName, Action>;
type Actions = Record<ActionName, Action>;

export default class CreatureActions {
  data: Actions = {
    MoveNorth: {
      name: "MoveNorth",    // 0
      enabled: false,
      family: "move",
    },
    MoveSouth: {
      name: "MoveSouth",  // 1
      enabled: false,
      family: "move",
    },
    MoveEast: {
      name: "MoveEast", // 2
      enabled: true,
      family: "move",
    },
    MoveWest: {
      name: "MoveWest", // 3
      enabled: false,
      family: "move",
    },
    RandomMove: {
      name: "RandomMove", // 4
      enabled: false,
      family: "move",
    },
    MoveForward: {
      name: "MoveForward",  // 5
      enabled: false,
      family: "move",
    },
    Photosynthesis: {
      name: "Photosynthesis", // 6
      enabled: true,
      family: "basic",
    },
    Reproduction: {
      name: "Reproduction", // 7
      enabled: true,
      family: "basic",
    },
    Attack: {
      name: "Attack", // 8
      enabled: true,
      family: "attack",
    },

  };

  neuronsCount: number = 0;
  _energyConsumedByActionsExecution : number = 0;

  getList() {
    const list: ActionName[] = [];
    for (const key of Object.keys(this.data) as ActionName[]) {
      const item = this.data[key];
      if (item.enabled) {
        list.push(item.name);
      }
    }
    return list;
  }

  getFamilies() : string[] {
    const list: string[] = [];
    for (const key of Object.keys(this.data) as ActionName[]) {
      const item = this.data[key];
      if (item.enabled) {
        list.push(item.family);
      }
    }
    return list;
  }

  getFamily( index: number) : string {
    let i = 0;
    for (const key of Object.keys(this.data) as ActionName[]) {
      const item = this.data[key];
      if (item.enabled) {
        if (i++ == index) {
          return item.family;
        }
      }
    }
    throw new Error (`getFamily invalid index: ${index}  neuronsCount: ${this.neuronsCount}`);
  }

  loadFromList(names: string[]) {
    for (const key of Object.keys(this.data) as ActionName[]) {
      this.data[key].enabled = names.includes(key);
    }

    this.updateInternalValues();
  }

  private updateInternalValues() {
    this.neuronsCount = 0;

    for (const { enabled } of Object.values(this.data)) {
      if (enabled) {
        this.neuronsCount++;
      }
    }
    this._energyConsumedByActionsExecution = this.neuronsCount * constants.MASS_COST_PER_EXECUTE_ACTION;
  }

  executeActions(creature: Creature, values: number[]) {
    let currentIndex = 0;
    let input = values[0];
    let energyConsumedByActionsExecution = 0;

    // MoveNorth
    if (this.data.MoveNorth.enabled) {
      if (input > 0) {
        creature.addUrgeToMove(0, -input);
      }

      currentIndex++;
      input = values[currentIndex];
    }

    // MoveSouth
    if (this.data.MoveSouth.enabled) {
      if (input > 0) {
        creature.addUrgeToMove(0, input);
      }

      currentIndex++;
      input = values[currentIndex];
    }

    // MoveEast
    if (this.data.MoveEast.enabled) {
      if (input > 0) {
        creature.addUrgeToMove(input, 0);
      }

      currentIndex++;
      input = values[currentIndex];
    }

    // MoveWest
    if (this.data.MoveWest.enabled) {
      if (input > 0) {
        creature.addUrgeToMove(-input, 0);
      }

      currentIndex++;
      input = values[currentIndex];
    }

    // RandomMove
    if (this.data.RandomMove.enabled) {
      if (input > 0) {
        creature.addUrgeToMove(
          (Math.random() * 2 - 1) * input,
          (Math.random() * 2 - 1) * input
        );
      }

      currentIndex++;
      input = values[currentIndex];
    }

    // MoveForward
    if (this.data.MoveForward.enabled) {
      if (input > 0) {
        creature.addUrgeToMove(
          creature.lastMovement[0],
          creature.lastMovement[1]
        );
      }
      //RD: --> MoveForward no tenia aquestes linies. Per que???
      currentIndex++;
      input = values[currentIndex];
    }

    // Photosynthesis
    if (this.data.Photosynthesis.enabled) {
      if (input > 0) {
        creature.photosynthesis(input);
        //creature.log("foto", creature.mass);
      }

      currentIndex++;
      input = values[currentIndex];
    }


    // Reproduction
    if (this.data.Reproduction.enabled) {
      if (input > 0) { 
        creature.reproduce(input);
      }

      currentIndex++;
      input = values[currentIndex];
    }

    // Attack
    if (this.data.Attack.enabled) {
      if (input > constants.ACTION_REPRODUCTION_OFFSET) {    // was 0

        const targetDirection : Direction4 = creature.generations.grid.getNeighbour4Creature(creature.position);
        if (targetDirection!=null) {
          creature.attack(input, targetDirection);
        }
      }

      currentIndex++;
      input = values[currentIndex];
    }
   
    return this._energyConsumedByActionsExecution;


  }
}

