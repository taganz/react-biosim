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
    // keep the code if it was chosen in Settings or the restart repeats the run (fixed seed,
    // no changes); otherwise this is a new run with a new code
    worldController.startRun(simulationData, worldController.restartSimCode(simulationData));
  };

  return (
    <Button variant="danger" icon={<FaRedo />} aria-label="Restart" title="Restart" onClick={handleClick}>
      {compact ? <span className="hidden sm:inline">Restart</span> : "Restart"}
    </Button>
  );
}
