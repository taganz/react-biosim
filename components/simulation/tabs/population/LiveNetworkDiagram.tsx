"use client";

import Creature from "@/simulation/creature/Creature";
import useWorldValue from "@/hooks/useWorldValue";
import NetworkDiagram, { NetworkActivity, NetworkLegend } from "./NetworkDiagram";

interface Props {
  creature: Creature;
  sensorLabels: string[];
  actionLabels: string[];
}

// Network of one creature with the values of the last step. It follows the simulation step by
// step only when Immediate steps is 1; with more, it shows the values from when it was rendered
export default function LiveNetworkDiagram({ creature, sensorLabels, actionLabels }: Props) {
  // the value is only read to re-render on every step; it stays 0 when Immediate steps is not 1
  useWorldValue((world) => (world.immediateSteps === 1 ? world.currentStep : 0), 0);

  // the network updates these values in place every step, so read them on each render
  const network = creature.brain.brain;
  const activity: NetworkActivity = {
    inputs: [...network.inputs],
    neurons: network.neurons.map((neuron) => neuron.output),
    actions: [...network.outputs],
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm">
        <p>Pause or slow down the simulation to follow it step by step.</p>
      </div>
      <NetworkDiagram
        network={network}
        sensorLabels={sensorLabels}
        actionLabels={actionLabels}
        activity={activity}
      />
      <NetworkLegend showingActivity />
    </div>
  );
}
