"use client";

import WorldCanvas from "@/simulation/world/WorldCanvas";
import WorldController from "@/simulation/world/WorldController";
import {WorldEvents} from "@/simulation/events/WorldEvents";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import {worldControllerAtom, worldControllerDataAtom, worldGenerationDataAtom, eventLoggerAtom} from "./store";
import {worldCanvasAtom} from "@/components/simulation/store/worldAtoms";
//import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
//import EventLogger from "@/simulation/logger/EventLogger";

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
  const worldGenerationsData = useAtomValue(worldGenerationDataAtom);
  const setEventLogger = useSetAtom(eventLoggerAtom);
  
  useEffect(
    function instantiateWorld() {
      const worldController = new WorldController(worldControllerData, worldGenerationsData);
      setWorldController(worldController);
      worldController.startRun(worldControllerData, worldGenerationsData );  

      if (canvasRef.current) {
        const canvas : HTMLCanvasElement = canvasRef.current;
        setWorldCanvas(new WorldCanvas(worldController, canvas, worldControllerData.size));
        //TODO window.addEventListener("resize", this.redrawWorldCanvas.bind(this));
      } else {
        throw new Error("Cannot found canvas");
      }

      //setEventLoggerAtom(worldController.eventLogger);

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

        const initializeWorldCallback = () => {
          setEventLogger(worldController.eventLogger);
        };
  
        const startGenerationCallback = () => {
          worldCanvas.redraw();
        };
  
        const redrawCallback = () => {
          worldCanvas.redraw();
        };
  
  
        worldController.events.addEventListener(WorldEvents.initializeWorld,initializeWorldCallback);
        worldController.events.addEventListener(WorldEvents.startGeneration,startGenerationCallback);
        worldController.events.addEventListener(WorldEvents.redraw,redrawCallback);
        console.log("SimulationCanvas addEventListeners");
        
      return () => {
        worldController.events.removeEventListener(WorldEvents.initializeWorld,initializeWorldCallback);
        worldController.events.removeEventListener(WorldEvents.startGeneration,startGenerationCallback);
        worldController.events.removeEventListener(WorldEvents.redraw, redrawCallback);
      };
    }

  }, [worldController, worldCanvas, setEventLogger]);
  
  return <canvas className={className} id="simCanvas" ref={canvasRef}></canvas>;
}
