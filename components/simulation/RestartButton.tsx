"use client";

import Button from "../global/Button";
import { FaRedo } from "react-icons/fa";
import { useAtomValue } from "jotai";
import { simulationDataAtom, worldControllerAtom} from "./store";

interface Props {
  // icon only on narrow screens, for the control bar
  compact?: boolean;
}

export default function RestartButton({ compact = false }: Props) {
  //const restart = useSetAtom(restartAtom);
  const worldController = useAtomValue(worldControllerAtom);
  const simulationData = useAtomValue(simulationDataAtom);

  const handleClick = () => {
    if (!worldController) {
      console.warn("RestartButton worldController not found!");
      return;
    }
    // restarting loses all the evolution so far, which can be hours of simulation
    const confirmed = window.confirm(
      `Restart the simulation from generation 1?\n\n` +
        `The current evolution (generation ${worldController.currentGen}) will be lost. ` +
        `Save it first in the Files tab if you want to keep it.`
    );
    if (confirmed) {
      // keep the code if it was chosen in Settings or the restart repeats the run (fixed seed,
      // no changes); otherwise this is a new run with a new code
      worldController.startRun(simulationData, worldController.restartSimCode(simulationData));
    }
  };

  return (
    <Button variant="danger" icon={<FaRedo />} aria-label="Restart" title="Restart" onClick={handleClick}>
      {compact ? <span className="hidden sm:inline">Restart</span> : "Restart"}
    </Button>
  );
}
