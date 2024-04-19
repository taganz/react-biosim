"use client";

import WorldCanvas from "@/simulation/world/WorldCanvas";
import WorldController from "@/simulation/world/WorldController";
import {WorldEvents} from "@/simulation/events/WorldEvents";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import {worldControllerAtom, worldControllerDataAtom, worldGenerationDataAtom} from "./store";
import {worldCanvasAtom, currentGenAtom} from "@/components/simulation/store/worldAtoms";
import WorldGenerationData from "@/simulation/world/WorldGenerationData";

interface Props {
  className?: string;
}

export default function SimulationCanvas({ className }: Props) {
  const canvasRef = useRef(null);
  //const counter = useRef(0);
  //const counterMax = useRef(0);
  //const worldCreatures = useAtomValue(worldCreaturesAtom);
  const [worldCanvas, setWorldCanvas] = useAtom(worldCanvasAtom);
  //const [immediateStepsCount, setImmediateStepsCount] = useAtom(immediateStepsCountAtom);
  const [worldController, setWorldController] = useAtom(worldControllerAtom);
  const worldControllerData = useAtomValue(worldControllerDataAtom);
  const worldGenerationData = useAtomValue(worldGenerationDataAtom);
  
  useEffect(
    function instantiateWorld() {
      const worldController = new WorldController(worldControllerData, worldGenerationData);
      setWorldController(worldController);
      worldController.startRun(worldControllerData, worldGenerationData );  

      if (canvasRef.current) {
        const canvas : HTMLCanvasElement = canvasRef.current;
        setWorldCanvas(new WorldCanvas(worldController, canvas, worldControllerData.size));
        //TODO window.addEventListener("resize", this.redrawWorldCanvas.bind(this));
      } else {
        throw new Error("Cannot found canvas");
      }

      return () => {
        console.log("*** worldControlled destroyed ***");
        worldController.pause();
        setWorldController(null);
        console.log("*** worldCanvas destroyed ***");
        setWorldCanvas(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

  //TODO - cal afegir resize --> redraw?
  useEffect(
    function bindWorldControllerEvents() {

      if (worldController && worldCanvas) {        

        const startGenerationCallback = () => {
          worldCanvas.redraw();
        };
  
        const redrawCallback = () => {
          worldCanvas.redraw();
        };
  
  
        worldController.events.addEventListener(WorldEvents.startGeneration,startGenerationCallback);
        worldController.events.addEventListener(WorldEvents.redraw,redrawCallback);
        
      return () => {
        worldController.events.removeEventListener(WorldEvents.startGeneration,startGenerationCallback);
        worldController.events.removeEventListener(WorldEvents.redraw, redrawCallback);
      };
    }

  }, [worldController, worldCanvas]);
  
  return <canvas className={className} id="simCanvas" ref={canvasRef}></canvas>;
}
