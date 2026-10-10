"use client";

import Creature from "@/simulation/creature/Creature";
import useWorldValue from "@/hooks/useWorldValue";
import NetworkDiagram, { NetworkActivity, NetworkLegend } from "./NetworkDiagram";

interface Props {
  creature: Creature;
  sensorLabels: string[];
  actionLabels: string[];
}

// Network of one creature with the values of the last step; re-renders as the simulation advances
export default function LiveNetworkDiagram({ creature, sensorLabels, actionLabels }: Props) {
  const currentGen = useWorldValue((world) => world.currentGen, 0);
  const currentStep = useWorldValue((world) => world.currentStep, 0);
  const isInWorld = useWorldValue(
    (world) => creature.isAlive && world.generations.currentCreatures.includes(creature),
    false
  );

  // the network updates these values in place every step, so read them on each render
  const network = creature.brain.brain;
  const activity: NetworkActivity = {
    inputs: [...network.inputs],
    neurons: network.neurons.map((neuron) => neuron.output),
    actions: [...network.outputs],
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm" aria-live="off">
        {isInWorld
          ? `Creature #${creature.id} at generation ${currentGen}, step ${currentStep}. Pause or slow down the simulation to follow it step by step.`
          : `Creature #${creature.id} is no longer alive; showing the values of its last step.`}
      </p>
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
