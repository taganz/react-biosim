"use client";

import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import Creature from "@/simulation/creature/Creature";
import { Species } from "@/simulation/creature/Species";
import Button from "@/components/global/Button";
import useWorldValue from "@/hooks/useWorldValue";
import { findLivingParent, speciesMembers } from "@/simulation/generations/creatureQueries";
import {
  logCreatureIdAtom,
  selectedCreatureAtom,
  selectedSpeciesAtom,
  worldControllerAtom,
} from "../../store";

interface Props {
  creature: Creature;
}

// Moves the selection to other creatures (same species, parent) and logs the selected one
export default function CreatureToolbar({ creature }: Props) {
  const worldController = useAtomValue(worldControllerAtom);
  const setSelectedCreature = useSetAtom(selectedCreatureAtom);
  const setSelectedSpecies = useSetAtom(selectedSpeciesAtom);
  const setLogCreatureId = useSetAtom(logCreatureIdAtom);
  const [logMessage, setLogMessage] = useState("");

  // "index,count": a string, so the snapshot is a primitive
  const position = useWorldValue((world) => {
    const members = speciesMembers(world.generations, creature);
    return `${members.indexOf(creature)},${members.length}`;
  }, "-1,0");
  const [index, count] = position.split(",").map(Number);
  const hasParent = useWorldValue((world) => findLivingParent(world.generations, creature) !== undefined, false);
  const logEnabled = useWorldValue((world) => Boolean(world.simData.constants.LOG_ENABLED), false);

  // the creature itself is skipped when it is still in the list
  const others = index >= 0 ? count - 1 : count;

  const selectSibling = (direction: 1 | -1) => {
    if (!worldController) return;
    const members = speciesMembers(worldController.generations, creature);
    if (members.length === 0) return;
    const current = members.indexOf(creature);
    const next =
      current < 0
        ? direction === 1 ? 0 : members.length - 1
        : (current + direction + members.length) % members.length;
    // same genome, so the selected species does not change
    setSelectedCreature(members[next]);
  };

  const selectParent = () => {
    if (!worldController) return;
    const parent = findLivingParent(worldController.generations, creature);
    if (!parent) return;
    // a mutation may have made the child a new species
    setSelectedCreature(parent);
    setSelectedSpecies(new Species(parent.brain.genome.clone(), [parent]));
  };

  const logCreature = () => {
    if (!worldController) return;
    setLogCreatureId(creature.id);
    try {
      worldController.eventLogger.startLoggingCreatureId(creature.id);
      setLogMessage(`Logging creature #${creature.id}. Save the log in Stats → Logger.`);
    } catch {
      // the logger is already set to the new id; only the first record of the creature failed
      setLogMessage(`Creature #${creature.id} is not alive; it will be logged if a creature with this id appears.`);
    }
    worldController.notifyStateChange();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => selectSibling(-1)}
          disabled={others === 0}
          aria-label="Previous creature of this species"
          title="Previous creature of this species"
        >
          ◀
        </Button>
        <span className="text-sm tabular-nums">
          {index >= 0 ? `${index + 1} of ${count} in its species` : `${count} alive in its species`}
        </span>
        <Button
          onClick={() => selectSibling(1)}
          disabled={others === 0}
          aria-label="Next creature of this species"
          title="Next creature of this species"
        >
          ▶
        </Button>
        <Button
          onClick={selectParent}
          disabled={!hasParent}
          title={hasParent ? "Select the parent of this creature" : "The parent is not alive"}
        >
          Select parent
        </Button>
        {logEnabled && <Button onClick={logCreature}>Log this creature</Button>}
      </div>
      {logMessage && <p role="status" className="text-xs">{logMessage}</p>}
    </div>
  );
}
