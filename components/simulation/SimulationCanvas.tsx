"use client";

import WorldCanvas from "@/simulation/world/WorldCanvas";
import WorldController from "@/simulation/world/WorldController";
import {WorldEvents} from "@/simulation/events/WorldEvents";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import {worldControllerAtom, worldCreaturesAtom, worldObjectsAtom} from "./store";
import {sizeAtom, worldCanvasAtom, currentGenAtom} from "@/components/simulation/store/worldAtoms";
import {immediateStepsAtom} from "./store/guiControlsAtoms";

interface Props {
  className?: string;
}

export default function SimulationCanvas({ className }: Props) {
  const canvasRef = useRef(null);
  const counter = useRef(0);
  const counterMax = useRef(0);
  const size = useAtomValue(sizeAtom);
  const worldCreatures = useAtomValue(worldCreaturesAtom);
  const worldObjects = useAtomValue(worldObjectsAtom);
  const [worldCanvas, setWorldCanvas] = useAtom(worldCanvasAtom);
  const [worldController, setWorld] = useAtom(worldControllerAtom);
  const immediateSteps = useAtomValue(immediateStepsAtom);
  //const [immediateStepsCount, setImmediateStepsCount] = useAtom(immediateStepsCountAtom);

 
  useEffect(
    function instantiateWorldCanvas() {

      if (canvasRef.current) {
        const canvas : HTMLCanvasElement = canvasRef.current;
        setWorldCanvas(new WorldCanvas(canvas, size, worldCreatures, worldObjects));
        //TODO window.addEventListener("resize", this.redrawWorldCanvas.bind(this));
      } else {
        throw new Error("Cannot found canvas");
      }
      //setImmediateStepsCount(immediateSteps);
      console.log("sc - instantiate worldcanvas");
      // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);



  // Redraw canvas
  const handleRedraw = useCallback(() => {
    //console.log("sc - redraw() - counter.current: ", counter.current);
    if (!worldCanvas) {
      console.error("SimulationCanvas worldCanvas not found at redraw()");
      return;
    }
    if (!worldController) {
      console.error("SimulationCanvas worldController not found at redraw()");
      return;
    }
    if (counter.current > 1) {
      //console.log("NO redraw ");
      counter.current-= 1;
    } else {
      worldCanvas.redraw(worldController.generations.currentCreatures);
      //console.log("redraw ");
      counter.current = counterMax.current;
    }
  },[worldCanvas, worldController]);

  /*
  //TODO - mirar per que no es crida mai
  const handleInitializeWorld = useCallback(() => {
    counter.current = immediateSteps;
    console.log("sc - initialize world - immediate steps: ", immediateSteps, "counter.current: ", counter.current);
    handleRedraw();
  }, [handleRedraw, immediateSteps]);
*/
  useEffect (
    function resetCounter() {
      counterMax.current = immediateSteps;
      counter.current = counterMax.current;  
      console.log("sc - reset counter - immediate steps ", immediateSteps); //, "counter.current: ", counter.current);
    }, [immediateSteps]);

  //TODO - cal afegir resize --> redraw?
  useEffect(
    function bindWorldControllerEvents() {
      console.log("sc - add listeners");
      if (worldController) {
        /*
        worldController.events.addEventListener(
          WorldEvents.initializeWorld,
          handleInitializeWorld
        );
        */
        worldController.events.addEventListener(
          WorldEvents.startGeneration,
          handleRedraw
        );
        worldController.events.addEventListener(
          WorldEvents.endStep,
          handleRedraw
        );
        return () => {/*
          worldController.events.removeEventListener(
            WorldEvents.initializeWorld,
            handleInitializeWorld
          );
          */
          worldController.events.removeEventListener(
            WorldEvents.startGeneration,
            handleRedraw
          );
          worldController.events.addEventListener(
            WorldEvents.endStep,
            handleRedraw
          );
        };
      }
    }, [worldController, handleRedraw]);
  
  return <canvas className={className} id="simCanvas" ref={canvasRef}></canvas>;
}
