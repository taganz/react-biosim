import { random } from "@/simulation/helpers/random";
import { DetectedCreature, detectClosest } from "@/simulation/world/grid/GridDetect";
import Creature from "../Creature";
import { Genus } from "../CreatureGenus";
import Connection from "./Connection";
import { NeuronType } from "./Neuron";

const preySensorNames: SensorName[] = [
  "PreyDistance", "PreyNorth", "PreyEast", "PreySouth", "PreyWest", "PreyProximity",
];

// The sensors in the order of the data table, for the switch of writeOutputs
const enum SensorCode {
  HorizontalPosition, VerticalPosition, Age, Oscillator, Random, HorizontalSpeed, VerticalSpeed,
  HorizontalBorderDistance, VerticalBorderDistance, BorderDistance,
  TouchNorth, TouchEast, TouchSouth, TouchWest, Pain, PopulationDensity, Mass,
  PreyDistance, PreyNorth, PreyEast, PreySouth, PreyWest, PredatorDistance, PredatorDirection,
  PreyProximity,
}

// the sensors that read the closest prey, found by one search shared by all of them
function isPreyCode(code: SensorCode): boolean {
  return (code >= SensorCode.PreyDistance && code <= SensorCode.PreyWest) || code === SensorCode.PreyProximity;
}

const adjacentTilesLookup: [number, number][] = [
  [-1, 1],
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
];

// Touch sensors: 1.0 if the tile holds a creature or a solid object.
// Tiles outside the world count as solid (the border blocks movement too).
function touchValue(creature: Creature, x: number, y: number): number {
  const tile = creature.generations.grid.cell(x, y);
  return tile.creature || tile.isSolid ? 1.0 : 0;
}

export type SensorName =
  | "HorizontalPosition"    // 0
  | "VerticalPosition"      // 1
  | "Age"                   // 2
  | "Oscillator"            // 3
  | "Random"                // 4
  | "HorizontalSpeed"       // 5
  | "VerticalSpeed"         // 6
  | "HorizontalBorderDistance"  // 7
  | "VerticalBorderDistance"  // 8
  | "BorderDistance"        // 9
  | "TouchNorth"                 // 10
  | "TouchEast"                // 11
  | "TouchSouth"               // 12
  | "TouchWest"                // 13
  | "Pain"                  // 14
  | "PopulationDensity"     // 15
  | "Mass"                  // 16
  | "PreyDistance"          // 17
  | "PreyNorth"              // 18     
  | "PreyEast"              // 19
  | "PreySouth"              // 20
  | "PreyWest"              // 21
  | "PredatorDistance"      // 22
  | "PredatorDirection"     // 23
  | "PreyProximity";        // 24

export type Sensor = {
  name: SensorName;
  enabled: boolean;
  neuronCount: number;   //TODO to be removed. should be always 1
  compatibleGenus: Genus[];     
  mainGenus: Genus | null,    //TODO to be removed. always null in sensors 
};

//export type Sensors = Record<SensorName, Sensor>;
type Sensors = Record<SensorName, Sensor>;


export default class CreatureSensors {
  
  //TODO neuronCount should be always 1, should be removed
  data: Sensors = {
    HorizontalPosition: {
      name: "HorizontalPosition",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    VerticalPosition: {
      name: "VerticalPosition",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    Age: {
      name: "Age",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    Oscillator: {
      name: "Oscillator",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    Random: {
      name: "Random",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    HorizontalSpeed: {
      name: "HorizontalSpeed",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },
    VerticalSpeed: {
      name: "VerticalSpeed",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },
    HorizontalBorderDistance: {
      name: "HorizontalBorderDistance",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    VerticalBorderDistance: {
      name: "VerticalBorderDistance",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    BorderDistance: {
      name: "BorderDistance",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    TouchNorth: {
      name: "TouchNorth",
      enabled: false,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    TouchEast: {
      name: "TouchEast",
      enabled: false,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    TouchSouth: {
      name: "TouchSouth",
      enabled: false,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    TouchWest: {
      name: "TouchWest",
      enabled: false,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    Pain: {
      name: "Pain",
      enabled: false,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    PopulationDensity: {
      name: "PopulationDensity",
      enabled: false,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    Mass: {
      name: "Mass",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["plant", "attack_plant", "attack_animal"],
      mainGenus: null,
    },
    PreyDistance: {
      name: "PreyDistance",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },

    PreyNorth: {
      name: "PreyNorth",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },

    PreyEast: {
      name: "PreyEast",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },

    PreySouth: {
      name: "PreySouth",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },

    PreyWest: {
      name: "PreyWest",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },

    PredatorDistance: {
      name: "PredatorDistance",
      enabled: false,   // not implemented yet: calculateOutputs pushes no value
      neuronCount: 1,
      compatibleGenus: ["attack_plant"],
      mainGenus: null,
    },
    PredatorDirection: {
      name: "PredatorDirection",
      enabled: false,   // not implemented yet: calculateOutputs pushes no value
      neuronCount: 1,
      compatibleGenus: ["attack_plant"],
      mainGenus: null,
    },
    PreyProximity: {
      name: "PreyProximity",
      enabled: false,
      neuronCount: 1,
      compatibleGenus: ["attack_plant", "attack_animal"],
      mainGenus: null,
    },
  };


  neuronsCount: number = 0;
  enabledSensors : SensorName[] = [];
  // the code of each enabled sensor, by enabled id
  private enabledCodes: SensorCode[] = [];

  private getList() {
    const list: SensorName[] = [];
    for (const key of Object.keys(this.data) as SensorName[]) {
      const item = this.data[key];
      if (item.enabled) {
        list.push(item.name);
      }
    }
    return list;
  }

  loadFromList(names: SensorName[]) {
    for (const key of Object.keys(this.data) as SensorName[]) {
      this.data[key].enabled = names.includes(key);
    }

    this.updateInternalValues();
    this.enabledSensors = this.getList();
    this.updateCodes();
  }

  // the codes follow the enabled flags of the table
  private updateCodes() {
    const tableNames = Object.keys(this.data) as SensorName[];
    this.enabledCodes = [];
    tableNames.forEach((name, code) => {
      if (this.data[name].enabled) this.enabledCodes.push(code);
    });
  }

  private updateInternalValues() {
    this.neuronsCount = 0;

    for (const { enabled, neuronCount } of Object.values(this.data)) {
      if (enabled) {
        this.neuronsCount += neuronCount;
      }
    }
  }

  getGenusMain( index: number) : Genus | null {
    let i = 0;
    for (const key of Object.keys(this.data) as SensorName[]) {
      const item = this.data[key];
      if (item.enabled) {
        if (i++ == index) {
          return item.mainGenus;
        }
      }
    }
    throw new Error (`getGenusMain invalid index: ${index}  neuronsCount: ${this.neuronsCount}`);
  }

  // returns all genus compatibles with a sensor
  sensorsByCompatibleGenus( index: number) : Genus[] {
    let i = 0;
    for (const key of Object.keys(this.data) as SensorName[]) {
      const item = this.data[key];
      if (item.enabled) {
        if (i++ == index) {
          return item.compatibleGenus;
        }
      }
    }
    throw new Error (`sensorsByCompatibleGenus invalid index: ${index}  neuronsCount: ${this.neuronsCount}`);
  }

  //TODO to be removed. always null in sensors 
  sensorsByMainGenus(genus: Genus) : SensorName []{
    let i = 0;
    let sensorList : SensorName[] = [];
    for (const key of Object.keys(this.data) as SensorName[]) {
      const item = this.data[key];
      //console.log(key, item);
      if (item.enabled && item.mainGenus === genus) {
        sensorList.push(item.name);
        }
      }
    return sensorList;
  }

  sensorNameToId(sensorName: SensorName): number {
    return this.enabledSensors.indexOf(sensorName);
  }

  enabledSensorsForGenus(genus: Genus) : SensorName[] {
    return Object.values(this.data).filter(sensor =>
        sensor.compatibleGenus.includes(genus) && sensor.enabled === true
    ).map(item => {return item.name});;
  }

  // whether one of the connections reads one of the sensors named
  private readsSensors(connections: Connection[], names: SensorName[]): boolean {
    const ids = names.map((name) => this.sensorNameToId(name)).filter((id) => id >= 0);
    return connections.some((connection) =>
      connection.sourceType === NeuronType.SENSOR && ids.includes(connection.sourceId));
  }

  // whether one of the connections reads a prey sensor
  readsPreySensors(connections: Connection[]): boolean {
    return this.readsSensors(connections, preySensorNames);
  }

  // whether one of the connections reads the Random sensor
  readsRandomSensor(connections: Connection[]): boolean {
    return this.readsSensors(connections, ["Random"]);
  }

  // the enabled ids of the sensors that the connections read, in ascending order
  readSensorIds(connections: Connection[]): number[] {
    const ids = new Set<number>();
    for (const connection of connections) {
      if (connection.sourceType === NeuronType.SENSOR) ids.add(connection.sourceId);
    }
    return Array.from(ids).sort((a, b) => a - b);
  }

  // The values of all the enabled sensors, one per enabled sensor in table order.
  // needPrey false skips the prey search and needRandom false the draw of the Random sensor:
  // those sensors are set to 0
  calculateOutputs(creature: Creature, needPrey: boolean = true, needRandom: boolean = true): number[] {
    // not used by the step: it reads the flags again, which tests change directly
    this.updateCodes();
    const ids: number[] = [];
    for (let id = 0; id < this.enabledCodes.length; id++) {
      const code = this.enabledCodes[id];
      if (!needRandom && code === SensorCode.Random) continue;
      if (!needPrey && isPreyCode(code)) continue;
      ids.push(id);
    }
    const values: number[] = Array(this.enabledCodes.length).fill(0);
    this.writeOutputs(creature, ids, values);
    return values;
  }

  // the closest prey within DETECT_RADIUS, or null: the search the prey sensors and the
  // MoveToPrey action share
  static searchPrey(creature: Creature): DetectedCreature | null {
    return detectClosest(creature.generations.grid, creature.position,
      creature.generations.worldController.simData.constants.DETECT_RADIUS,
      creature.preyGenus);
  }

  // Writes the value of the sensors in ids (enabled ids, ascending) at their id in values and
  // leaves the other values as they are. Only Random draws a number and only the prey sensors
  // search the prey (once for all of them), so a brain computes only the sensors it reads.
  // sensedPrey is the result of a search already made in this step (null: no prey); undefined
  // searches here if a prey sensor needs it
  writeOutputs(creature: Creature, ids: number[], values: number[],
      sensedPrey?: DetectedCreature | null): void {
    const codes = this.enabledCodes;
    const position = creature.position;
    const worldSize = creature.generations.grid.size;
    let preySearched = sensedPrey !== undefined;
    let prey: DetectedCreature | null = sensedPrey ?? null;

    for (let k = 0; k < ids.length; k++) {
      const id = ids[k];
      const code = codes[id];
      let value: number;

      if (isPreyCode(code)) {
        // the distance and direction sensors share one search, the most expensive part of a step
        if (!preySearched) {
          prey = CreatureSensors.searchPrey(creature);
          preySearched = true;
        }
        switch (code) {
          case SensorCode.PreyDistance:
            value = prey?.distance ?? 999999;
            break;
          case SensorCode.PreyNorth:
            value = prey && prey.position[1] < position[1] ? 1 : 0;
            break;
          case SensorCode.PreyEast:
            value = prey && prey.position[0] > position[0] ? 1 : 0;
            break;
          case SensorCode.PreySouth:
            value = prey && prey.position[1] > position[1] ? 1 : 0;
            break;
          case SensorCode.PreyProximity: {
            // 1 for a neighbour, falling to 1 / DETECT_RADIUS at the edge of the radius; 0 without prey
            const radius = Math.abs(creature.generations.worldController.simData.constants.DETECT_RADIUS);
            value = prey ? (radius + 1 - prey.distance) / radius : 0;
            break;
          }
          default:  // PreyWest
            value = prey && prey.position[0] < position[0] ? 1 : 0;
        }
        values[id] = value;
        continue;
      }

      switch (code) {
        case SensorCode.HorizontalPosition:
          value = position[0] / worldSize;
          break;
        case SensorCode.VerticalPosition:
          value = position[1] / worldSize;
          break;
        case SensorCode.Age:
          // generational runs, time since the start of the generation (0 to 1);
          // continuous runs, the age of the creature over maxAge (0 to 1)
          value = creature.generations.isContinuous
            ? creature._age / creature.generations.maxAge
            : creature.generations.worldController.currentStep / creature.generations.worldController.stepsPerGen;
          break;
        case SensorCode.Oscillator:
          value = (Math.sin(creature.generations.worldController.currentStep / 10) + 1) / 2;
          break;
        case SensorCode.Random:
          value = random();
          break;
        case SensorCode.HorizontalSpeed:
          value = (position[0] - creature.lastPosition[0] + 1) / 2;
          break;
        case SensorCode.VerticalSpeed:
          value = (position[1] - creature.lastPosition[1] + 1) / 2;
          break;
        case SensorCode.HorizontalBorderDistance:
          value = (Math.min(position[0], worldSize - position[0]) / worldSize) * 2;
          break;
        case SensorCode.VerticalBorderDistance:
          value = (Math.min(position[1], worldSize - position[1]) / worldSize) * 2;
          break;
        case SensorCode.BorderDistance:
          value = (Math.min(
            Math.min(position[0], worldSize - position[0]),
            Math.min(position[1], worldSize - position[1])) / worldSize) * 2;
          break;
        // Touch: 0.0 -> empty, 1.0 -> creature, solid cell or world border
        case SensorCode.TouchNorth:
          value = position[1] - 1 >= 0 ? touchValue(creature, position[0], position[1] - 1) : 1.0;
          break;
        case SensorCode.TouchEast:
          value = position[0] + 1 < worldSize ? touchValue(creature, position[0] + 1, position[1]) : 1.0;
          break;
        case SensorCode.TouchSouth:
          value = position[1] + 1 < worldSize ? touchValue(creature, position[0], position[1] + 1) : 1.0;
          break;
        case SensorCode.TouchWest:
          value = position[0] - 1 >= 0 ? touchValue(creature, position[0] - 1, position[1]) : 1.0;
          break;
        case SensorCode.Pain:
          value = (100 - creature.health) / 100;
          break;
        case SensorCode.PopulationDensity: {
          let populationCount = 0;
          for (let tileIndex = 0; tileIndex < adjacentTilesLookup.length; tileIndex++) {
            const x = position[0] + adjacentTilesLookup[tileIndex][0];
            const y = position[1] + adjacentTilesLookup[tileIndex][1];
            if (x >= 0 && y >= 0 && x < worldSize && y < worldSize &&
                creature.generations.grid.cell(x, y).creature) {
              populationCount++;
            }
          }
          value = populationCount * 0.125;
          break;
        }
        case SensorCode.Mass:
          value = creature.mass;
          break;
        default:
          // PredatorDistance and PredatorDirection are not implemented: a connection that reads
          // them gets no value and the brain computes NaN, as before (see docs/known-issues.md)
          value = NaN;
      }
      values[id] = value;
    }
  }
}
