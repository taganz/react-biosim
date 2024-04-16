"use client";

import WorldCanvas from "@/simulation/world/WorldCanvas";
import WorldController from "@/simulation/world/WorldController";
import {WorldEvents} from "@/simulation/events/WorldEvents";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import {worldControllerAtom, worldControllerDataAtom, worldObjectsAtom, worldGenerationDataAtom} from "./store";
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
  const worldObjects = useAtomValue(worldObjectsAtom);
  const [worldCanvas, setWorldCanvas] = useAtom(worldCanvasAtom);
  //const [immediateStepsCount, setImmediateStepsCount] = useAtom(immediateStepsCountAtom);
  const [worldController, setWorldController] = useAtom(worldControllerAtom);
  const worldControllerData = useAtomValue(worldControllerDataAtom);
  const worldGenerationData = useAtomValue(worldGenerationDataAtom);
  
  useEffect(
    function instantiateWorld() {
      console.log("*** worldController instantiated *** ");
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

    /*
  useEffect(
    function instantiateWorldCanvas() {
      if (canvasRef.current) {
        const canvas : HTMLCanvasElement = canvasRef.current;
        setWorldCanvas(new WorldCanvas(worldController, canvas, worldControllerData.size));
        //TODO window.addEventListener("resize", this.redrawWorldCanvas.bind(this));
      } else {
        throw new Error("Cannot found canvas");
      }
      return () => {
        console.log("*** worldCanvas destroyed ***");
        setWorldCanvas(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps      
  },[]);
*/
    const handleInitializeWorldCanvas = useCallback( () => {
      if (worldCanvas) {
        console.log("SimulationCanvas handleInitializeWorldCanvas objects: ", worldControllerData.worldObjects);
        worldCanvas.objects = [...worldControllerData.worldObjects];
      } else {
        throw new Error ("worldCanvas not found");
      }
  }, [worldCanvas, worldControllerData.worldObjects]);

  //TODO - cal afegir resize --> redraw?
  useEffect(
    function bindWorldControllerEvents() {

      console.log("sc - add listeners");
      if (worldController && worldCanvas) {
        
        worldController.events.addEventListener(
          WorldEvents.initializeWorld,
          handleInitializeWorldCanvas
        );
        
        worldController.events.addEventListener(
          WorldEvents.startGeneration,
          () => {worldCanvas.redraw();}
        );
        worldController.events.addEventListener(
          WorldEvents.redraw,
          () => {worldCanvas.redraw();}
        );
        return () => {
          worldController.events.removeEventListener(
            WorldEvents.initializeWorld,
            handleInitializeWorldCanvas
          );
          
          worldController.events.removeEventListener(
            WorldEvents.startGeneration,
            () => {worldCanvas.redraw();}
          );
          worldController.events.removeEventListener(
            WorldEvents.redraw,
            () => {worldCanvas.redraw();}
          );
        };
      }
      else {
        console.log("SimulationCanvas - couldn't add listeners!! ", worldController, worldCanvas);
      }

  }, [worldController, handleInitializeWorldCanvas, worldCanvas]);
  
  return <canvas className={className} id="simCanvas" ref={canvasRef}></canvas>;
}
