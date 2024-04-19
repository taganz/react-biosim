import Creature from "../../Creature";
import { drawNeuronalNetwork } from "./drawNeuronalNetwork";

function getLabelForNeuron(creature: Creature, index: number, group: number) {
  if (group === 1) {
    // Create a list of names
    const names: string[] = [];
    for (const { enabled, name, neuronCount } of Object.values(
      creature.brain.sensors.data
    )) {
      if (enabled) {
        for (let i = 0; i < neuronCount; i++) {
          let finalName = `(In) ${name}`;
          if (neuronCount > 1) {
            // If the sensor has more than one output
            finalName += ` [${i + 1}]`;
          }

          names.push(finalName);
        }
      }
    }

    return names[index];
  } else if (group === 2) {
    // Create a list of names
    const names: string[] = [];
    for (const { enabled, name } of Object.values(creature.brain.actions.data)) {
      if (enabled) {
        names.push(name);
      }
    }

    return names[index];
  } else if (group === 3) {
    return index.toString();
  }
  return undefined;
}

export function drawCreatureNeuronalNetwork(
  creature: Creature,
  canvas: HTMLCanvasElement
) {
  return drawNeuronalNetwork(
    creature.brain.brain,
    canvas,
    (index: number, group: number) => getLabelForNeuron(creature, index, group)
  );
}
