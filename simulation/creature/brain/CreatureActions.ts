import Creature from "../Creature";
import * as constants from "../../simulationDataDefault"
import {Direction, Direction4} from '@/simulation/world/direction';
import { GridPosition } from "@/simulation/world/grid/Grid";
import { Genus } from "../CreatureGenus";


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
  | "AttackPlant"
  | "AttackAnimal";

export type Action = {
  name: ActionName;
  enabled: boolean;
  compatibleGenus: Genus[];
  mainGenus: Genus | null;
};


//export type Actions = Record<ActionName, Action>;
type Actions = Record<ActionName, Action>;

// compatibleGenus field values should be ordered from less to more sophisticated
export default class CreatureActions {
  data: Actions = {
    MoveNorth: {
      name: "MoveNorth",    // 0
      enabled: false,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },
    MoveSouth: {
      name: "MoveSouth",  // 1
      enabled: false,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },
    MoveEast: {
      name: "MoveEast", // 2
      enabled: true,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null
    },
    MoveWest: {
      name: "MoveWest", // 3
      enabled: false,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },
    RandomMove: {
      name: "RandomMove", // 4
      enabled: false,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },
    MoveForward: {
      name: "MoveForward",  // 5
      enabled: false,
      compatibleGenus: ["attack_plant","attack_animal"],
      mainGenus: null,
    },
    Photosynthesis: {
      name: "Photosynthesis", // 6
      enabled: true,
      compatibleGenus: ["plant"],
      mainGenus: "plant",
    },
    Reproduction: {
      name: "Reproduction", // 7
      enabled: true,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    AttackPlant: {
      name: "AttackPlant", // 8
      enabled: true,
      compatibleGenus: ["attack_plant", "attack_animal"],   //TODO review should attack_animal attack plants?
      mainGenus: "attack_plant",
    },
    AttackAnimal: {
      name: "AttackAnimal", // 9
      enabled: true,
      compatibleGenus: ["attack_animal"],
      mainGenus: "attack_animal",
    },

  };

  neuronsCount: number = 0;
  enabledActions: ActionName[] = [];
  _energyConsumedByActionsExecution : number = 0;


  constructor (private costPerExecuteAction: number,
               private actionReproductionOffset: number
   ){

  }
  private getList() {
    const list: ActionName[] = [];
    for (const key of Object.keys(this.data) as ActionName[]) {
      const item = this.data[key];
      if (item.enabled) {
        list.push(item.name);
      }
    }
    return list;
  }

  /*
  getFamilies() : string[] {
    const list: string[] = [];
    for (const key of Object.keys(this.data) as ActionName[]) {
      const item = this.data[key];
      if (item.enabled) {
        list.push(item.compatibleGenus);
      }
    }
    return list;
  }
  */

  
  getGenusMain( index: number) : Genus | null {
    let i = 0;
    for (const key of Object.keys(this.data) as ActionName[]) {
      const item = this.data[key];
      if (item.enabled) {
        if (i++ == index) {
          return item.mainGenus;
        }
      }
    }
    throw new Error (`getGenusMain invalid index: ${index}  neuronsCount: ${this.neuronsCount}`);
  }
  actionsByCompatibleGenus( index: number) : Genus[] {
    let i = 0;
    for (const key of Object.keys(this.data) as ActionName[]) {
      const item = this.data[key];
      if (item.enabled) {
        if (i++ == index) {
          return item.compatibleGenus;
        }
      }
    }
    throw new Error (`sensorsByCompatibleGenus invalid index: ${index}  neuronsCount: ${this.neuronsCount}`);
  }

 // returns all genus compatibles with a sensor
 actionsByMainGenus( genus: Genus) : ActionName[] {
  let i = 0;
  let actionList : ActionName[] = [];
  for (const key of Object.keys(this.data) as ActionName[]) {
    const item = this.data[key];
    //console.log(key, item);
    if (item.enabled && item.mainGenus === genus) {
      actionList.push(item.name);
      }
    }
  return actionList;
  }
  loadFromList(names: string[]) {
    for (const key of Object.keys(this.data) as ActionName[]) {
      this.data[key].enabled = names.includes(key);
    }

    this.updateInternalValues();
    this.enabledActions = this.getList();
  }

  private updateInternalValues() {
    this.neuronsCount = 0;

    for (const { enabled } of Object.values(this.data)) {
      if (enabled) {
        this.neuronsCount++;
      }
    }
    this._energyConsumedByActionsExecution = this.neuronsCount * this.costPerExecuteAction; 
  }

  actionNameToId(actionName: ActionName): number {
    return this.enabledActions.indexOf(actionName);
  }


  enabledActionsForGenus(genus: Genus) : ActionName[] {
    return Object.values(this.data).filter(action =>
        action.compatibleGenus.includes(genus) && action.enabled === true
    ).map(item => {return item.name});;
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

    // AttackPlant
    if (this.data.AttackPlant.enabled) {
      if (input > this.actionReproductionOffset) {    // was 0

        const targetDirection : Direction4 = creature.generations.grid.getNeighbour4Creature(creature.position);
        if (targetDirection!=null) {    //TODO check if target creature is plant
          creature.attack(input, targetDirection);
        }
      }

      currentIndex++;
      input = values[currentIndex];
    }

   // AttackAnimal
   if (this.data.AttackAnimal.enabled) {
    if (input > this.actionReproductionOffset) {    // was 0

      const targetDirection : Direction4 = creature.generations.grid.getNeighbour4Creature(creature.position);
      if (targetDirection!=null) {      //TODO check if target creature is animal or change to Attack and don't check
        creature.attack(input, targetDirection);
      }
    }

    currentIndex++;
    input = values[currentIndex];
  }
 
    return this._energyConsumedByActionsExecution;


  }
}

