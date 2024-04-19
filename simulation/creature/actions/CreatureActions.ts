import Creature from "../Creature";
import * as constants from "../../simulationConstants"

// --> revisar. per evitar tenir-ho repetit a worldAtoms
export type ActionName =
  | "MoveNorth"
  | "MoveSouth"
  | "MoveEast"
  | "MoveWest"
  | "RandomMove"
  | "MoveForward"
  | "Photosynthesis"
  | "Reproduction";

export type Action = {
  name: ActionName;
  enabled: boolean;
};


export type Actions = Record<ActionName, Action>;

export default class CreatureActions {
  data: Actions = {
    MoveNorth: {
      name: "MoveNorth",
      enabled: false,
    },
    MoveSouth: {
      name: "MoveSouth",
      enabled: false,
    },
    MoveEast: {
      name: "MoveEast",
      enabled: true,
    },
    MoveWest: {
      name: "MoveWest",
      enabled: false,
    },
    RandomMove: {
      name: "RandomMove",
      enabled: false,
    },
    MoveForward: {
      name: "MoveForward",
      enabled: false,
    },
    Photosynthesis: {
      name: "Photosynthesis",
      enabled: true,
    },
    Reproduction: {
      name: "Reproduction",
      enabled: true,
    },
  };

  neuronsCount: number = 0;

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

  loadFromList(names: string[]) {
    for (const key of Object.keys(this.data) as ActionName[]) {
      this.data[key].enabled = names.includes(key);
    }

    this.updateInternalValues();
  }

  updateInternalValues() {
    this.neuronsCount = 0;

    for (const { enabled } of Object.values(this.data)) {
      if (enabled) {
        this.neuronsCount++;
      }
    }
  }

  executeActions(creature: Creature, values: number[]) {
    let currentIndex = 0;
    let input = values[0];

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
        creature.mass.add(constants.WATER_TO_MASS_PER_STEP * constants.TEMP_WATER_CELL_CREATURE);
        //creature.log("foto", creature.mass);
      }

      currentIndex++;
      input = values[currentIndex];
    }


    // Reproduction
    if (this.data.Photosynthesis.enabled) {
      if (input > 0) { 
        creature.reproduce(input);
      }

      currentIndex++;
      input = values[currentIndex];
    }

  }
}
