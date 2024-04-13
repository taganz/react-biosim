"use client";

import React from "react";
import Button from "../global/Button";
import { useSetAtom, useAtomValue } from "jotai";
import { worldControllerAtom, worldInitialValuesAtom } from "./store";

export default function RestartButton() {
  //const restart = useSetAtom(restartAtom);
  const worldController = useAtomValue(worldControllerAtom);
  const worldInitialValues = useAtomValue(worldInitialValuesAtom);

  const handleClick = () => {
    //restart(true);
    worldController?.startRun(worldInitialValues);
  };

  return (
    <Button variant="danger" onClick={handleClick}>
      Restart
    </Button>
  );
}
