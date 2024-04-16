import Creature from "../Creature";

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
  | "HorizontalPosition"
  | "VerticalPosition"
  | "Age"
  | "Oscillator"
  | "Random"
  | "HorizontalSpeed"
  | "VerticalSpeed"
  | "HorizontalBorderDistance"
  | "VerticalBorderDistance"
  | "BorderDistance"
  | "Touch"
  | "Pain"
  | "PopulationDensity"
  | "Mass";

export type Sensor = {
  name: SensorName;
  enabled: boolean;
  neuronCount: number;
};

export type Sensors = Record<SensorName, Sensor>;

export default class CreatureSensors {
  data: Sensors = {
    HorizontalPosition: {
      name: "HorizontalPosition",
      enabled: true,
      neuronCount: 1,
    },
    VerticalPosition: {
      name: "VerticalPosition",
      enabled: true,
      neuronCount: 1,
    },
    Age: {
      name: "Age",
      enabled: true,
      neuronCount: 1,
    },
    Oscillator: {
      name: "Oscillator",
      enabled: true,
      neuronCount: 1,
    },
    Random: {
      name: "Random",
      enabled: true,
      neuronCount: 1,
    },
    HorizontalSpeed: {
      name: "HorizontalSpeed",
      enabled: true,
      neuronCount: 1,
    },
    VerticalSpeed: {
      name: "VerticalSpeed",
      enabled: true,
      neuronCount: 1,
    },
    HorizontalBorderDistance: {
      name: "HorizontalBorderDistance",
      enabled: true,
      neuronCount: 1,
    },
    VerticalBorderDistance: {
      name: "VerticalBorderDistance",
      enabled: true,
      neuronCount: 1,
    },
    BorderDistance: {
      name: "BorderDistance",
      enabled: true,
      neuronCount: 1,
    },
    Touch: {
      name: "Touch",
      enabled: false,
      neuronCount: 4,
    },
    Pain: {
      name: "Pain",
      enabled: false,
      neuronCount: 1,
    },
    PopulationDensity: {
      name: "PopulationDensity",
      enabled: false,
      neuronCount: 1,
    },
    Mass: {
      name: "Mass",
      enabled: true,
      neuronCount: 1,
    },
  };

  neuronsCount: number = 0;

  getList() {
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
  }

  updateInternalValues() {
    this.neuronsCount = 0;

    for (const { enabled, neuronCount } of Object.values(this.data)) {
      if (enabled) {
        this.neuronsCount += neuronCount;
      }
    }
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
      values.push(creature.generations.currentStep / creature.generations.worldController.stepsPerGen);
    }

    // Oscillator
    if (this.data.Oscillator.enabled) {
      values.push((Math.sin(creature.generations.currentStep / 10) + 1) / 2);
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

    //Touch
    if (this.data.Touch.enabled) {
      // Outputs: 0.0 -> empty, 1.0 -> creature or solid cell

      // Top
      let x = creature.position[0];
      let y = creature.position[1] - 1;
      let tile;
      if (y >= 0) {
        tile = creature.generations.grid.cell(x,y);
        values.push(tile.creature || tile.isSolid ? 1.0 : 0);
      }

      // Right
      x = creature.position[0] + 1;
      y = creature.position[1];
      if (x < worldSize) {
        tile = creature.generations.grid.cell(x,y);
        values.push(tile.creature || tile.isSolid ? 1.0 : 0);
      }

      // Bottom
      x = creature.position[0];
      y = creature.position[1] + 1;
      if (y < worldSize) {
        tile = creature.generations.grid.cell(x,y);
        values.push(tile.creature || tile.isSolid ? 1.0 : 0);
      }

      // Left
      x = creature.position[0] - 1;
      y = creature.position[1];
      if (x >= 0) {
        tile = creature.generations.grid.cell(x,y);
        values.push(tile.creature || tile.isSolid ? 1.0 : 0);
      }
    }

    // Pain/Health
    if (this.data.Pain.enabled) {
      values.push((100 - creature.health) / 100);
    }

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

    return values;
  }
}
