"use client";

import { useAtomValue } from "jotai";
import Button from "@/components/global/Button";
import useWorldValue from "@/hooks/useWorldValue";
import Creature from "@/simulation/creature/Creature";
import { worldControllerAtom } from "../../store";

type Props = { kind: "species"; id: string } | { kind: "creature"; creature: Creature };

// Marks a species or a creature for the log of the Simulation tab ("Marked in Population")
export default function LogMarkButton(props: Props) {
  const worldController = useAtomValue(worldControllerAtom);
  const marked = useWorldValue(
    (world) => props.kind === "species"
      ? world.simulationLog.isSpeciesMarked(props.id)
      : world.simulationLog.isCreatureMarked(props.creature),
    false
  );
  const what = props.kind === "species" ? "species" : "creature";

  const toggle = () => {
    if (!worldController) return;
    const log = worldController.simulationLog;
    if (props.kind === "species") log.setSpeciesMarked(props.id, !marked);
    else log.setCreatureMarked(props.creature, !marked);
    worldController.notifyStateChange();
  };

  return (
    <Button
      onClick={toggle}
      aria-pressed={marked}
      title={marked
        ? `Remove this ${what} from the marked ones of the log (Simulation → Log)`
        : `Mark this ${what} for the log (Simulation → Log, Marked in Population)`}
    >
      {marked ? "✓ Marked for log" : "Mark for log"}
    </Button>
  );
}
