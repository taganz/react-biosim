import { detectClosest } from "@/simulation/world/grid/GridDetect";
import Creature from "../Creature";
import { Genus } from "../CreatureGenus";
import { Direction4 } from "@/simulation/world/direction";

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
  | "PredatorDirection";    // 23

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
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["attack_plant"],
      mainGenus: null,
    },
    PredatorDirection: {
      name: "PredatorDirection",
      enabled: true,
      neuronCount: 1,
      compatibleGenus: ["attack_plant"],
      mainGenus: null,
    },
  };


  neuronsCount: number = 0;
  enabledSensors : SensorName[] = [];

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

  calculateOutputs(creature: Creature): number[] {  
    const values: number[] = [];
    const worldSize = creature.generations.grid.size;

    // HorizontalPosition
    if (this.data.HorizontalPosition.enabled) {
      values.push(creature.position[0] / worldSize);
    }

    // VerticalPosition
    if (this.data.VerticalPosition.enabled) {
      values.push(creature.position[1] / worldSize);
    }

    // Age
    if (this.data.Age.enabled) {
      values.push(creature.generations.worldController.currentStep / creature.generations.worldController.stepsPerGen);
    }

    // Oscillator
    if (this.data.Oscillator.enabled) {
      values.push((Math.sin(creature.generations.worldController.currentStep / 10) + 1) / 2);
    }

    // Random
    if (this.data.Random.enabled) {
      values.push(Math.random());
    }

    // HorizontalSpeed
    if (this.data.HorizontalSpeed.enabled) {
      values.push((creature.position[0] - creature.lastPosition[0] + 1) / 2);
    }

    // VerticalSpeed
    if (this.data.VerticalPosition.enabled) {
      values.push((creature.position[1] - creature.lastPosition[1] + 1) / 2);
    }

    const horizontalDistance = Math.min(
      creature.position[0],
      worldSize - creature.position[0]
    );
    // HorizontalBorderDistance
    if (this.data.HorizontalBorderDistance.enabled) {
      values.push((horizontalDistance / worldSize) * 2);
    }

    const verticalDistance = Math.min(
      creature.position[1],
      worldSize - creature.position[1]
    );
    // VerticalBorderDistance
    if (this.data.VerticalBorderDistance.enabled) {
      values.push((verticalDistance / worldSize) * 2);
    }

    // BorderDistance
    if (this.data.BorderDistance.enabled) {
      values.push(
        (Math.min(horizontalDistance, verticalDistance) / worldSize) *
          2
      );
    }

    //TouchNorth
    if (this.data.TouchNorth.enabled) {
      // Outputs: 0.0 -> empty, 1.0 -> creature or solid cell
      // Top
      let x = creature.position[0];
      let y = creature.position[1] - 1;
      let tile;
      if (y >= 0) {
        tile = creature.generations.grid.cell(x,y);
        values.push(tile.creature || tile.isSolid ? 1.0 : 0);
      }
    }

    //TouchEast
    if (this.data.TouchEast.enabled) {
      // Outputs: 0.0 -> empty, 1.0 -> creature or solid cell
      // Right
      let x = creature.position[0] + 1;
      let y = creature.position[1];
      if (x < worldSize) {
        let tile = creature.generations.grid.cell(x,y);
        values.push(tile.creature || tile.isSolid ? 1.0 : 0);
      }

    }

    //TouchSouth
    if (this.data.TouchSouth.enabled) {
      // Outputs: 0.0 -> empty, 1.0 -> creature or solid cell
      // Bottom
      let x = creature.position[0];
      let y = creature.position[1] + 1;
      if (y < worldSize) {
        let tile = creature.generations.grid.cell(x,y);
        values.push(tile.creature || tile.isSolid ? 1.0 : 0);
      }

    }

    //TouchWest
    if (this.data.TouchWest.enabled) {
      // Outputs: 0.0 -> empty, 1.0 -> creature or solid cell
      // Left
      let x = creature.position[0] - 1;
      let y = creature.position[1];
      if (x >= 0) {
        let tile = creature.generations.grid.cell(x,y);
        values.push(tile.creature || tile.isSolid ? 1.0 : 0);
      }
    }
  
    // Pain/Health
    if (this.data.Pain.enabled) {
      values.push((100 - creature.health) / 100);
    }

    // Population Density
    if (this.data.PopulationDensity.enabled) {
      let populationCount = 0;

      for (
        let tileIndex = 0;
        tileIndex < adjacentTilesLookup.length;
        tileIndex++
      ) {
        const x = creature.position[0] + adjacentTilesLookup[tileIndex][0];
        const y = creature.position[1] + adjacentTilesLookup[tileIndex][1];

        if (
          x >= 0 &&
          y >= 0 &&
          x < worldSize &&
          y < worldSize
        ) {
          if (creature.generations.grid.cell(x,y).creature) {
            populationCount++;
          }
        }
      }

      values.push(populationCount * 0.125);
    }

    // Mass
    if (this.data.Mass.enabled) {
      values.push(creature.mass);
    }

    // PreyDistance
    if (this.data.PreyDistance.enabled) {
      const closestPrey = detectClosest(creature.generations.grid, creature.position, 
        creature.generations.worldController.simData.constants.DETECT_RADIUS,
        creature.preyGenus);
      values.push(closestPrey?.distance ?? 999999);
      //console.log("creature.preyGenus ", creature.preyGenus, "closestPrey.genus ", closestPrey?.genus);
      }
    
    // PreyDirection
    let preyDirection : Direction4[] = [];

    if (this.data.PreyNorth.enabled || this.data.PreyEast.enabled ||
       this.data.PreySouth.enabled || this.data.PreyWest.enabled) {
      const prey = detectClosest(creature.generations.grid, creature.position, 
        creature.generations.worldController.simData.constants.DETECT_RADIUS,
        creature.preyGenus);
      if (prey) {
        if (prey?.position[0] < creature.position[0]) preyDirection.push("W");
        if (prey?.position[0] > creature.position[0]) preyDirection.push("E");
        if (prey?.position[1] < creature.position[1]) preyDirection.push("N");
        if (prey?.position[1] > creature.position[1]) preyDirection.push("S");
      }
    }

    if (this.data.PreyNorth.enabled) {
      values.push(preyDirection?.includes("N") ? 1 : 0);
    }
    if (this.data.PreyEast.enabled) {
      values.push(preyDirection?.includes("E") ? 1 : 0);
    }
    if (this.data.PreySouth.enabled) {
      values.push(preyDirection?.includes("S") ? 1 : 0);
    }
    if (this.data.PreyWest.enabled) {
      values.push(preyDirection?.includes("W") ? 1 : 0);
    }   
    return values;
  }
}
