"use client";

import React from "react";
import { useAtomValue } from "jotai";
import { FaPause, FaPlay } from "react-icons/fa";
import Button from "../global/Button";
import { worldControllerAtom } from "./store";
import useWorldValue from "@/hooks/useWorldValue";

export default function PlayPauseButton() {
  const worldController = useAtomValue(worldControllerAtom);
  const isPaused = useWorldValue((world) => world.isPaused, false);

  const handleClick = () => {
    if (!worldController) return;
    if (isPaused) {
      worldController.resume();
    } else {
      worldController.pause();
    }
  };

  return (
    <Button
      variant="primary"
      // fixed width so the footer does not jump when the label changes
      className="min-w-28"
      icon={isPaused ? <FaPlay /> : <FaPause />}
      onClick={handleClick}
    >
      {isPaused ? "Play" : "Pause"}
    </Button>
  );
}
