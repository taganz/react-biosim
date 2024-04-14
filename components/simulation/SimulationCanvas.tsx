"use client";

import WorldCanvas from "@/simulation/world/WorldCanvas";
import WorldController from "@/simulation/world/WorldController";
import {WorldEvents} from "@/simulation/events/WorldEvents";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import {worldControllerAtom, worldCreaturesAtom, worldObjectsAtom, worldInitialValuesAtom} from "./store";
import {worldCanvasAtom, currentGenAtom} from "@/components/simulation/store/worldAtoms";
import WorldInitialValues from "@/simulation/world/WorldInitialValues";

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
  const worldInitialValues = useAtomValue(worldInitialValuesAtom);
  
  useEffect(
    function instantiateWorldController() {
      console.log("*** instantiate worldController with initialValues: ", worldInitialValues);
      const worldController = new WorldController(worldInitialValues);
      setWorldController(worldController);
      worldController.startRun();  
      return () => {
        console.log("*** worldControlled destroyed ***");
        worldController.pause();
        setWorldController(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

  useEffect(
    function instantiateWorldCanvas() {
      if (canvasRef.current) {
        const canvas : HTMLCanvasElement = canvasRef.current;
        setWorldCanvas(new WorldCanvas(canvas, worldInitialValues.size, worldObjects));
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

    const handleInitializeWorld = useCallback( () => {
      if (worldCanvas) {
        console.log("SimulationCanvas handleInitializeWorld objects: ", worldInitialValues.worldObjects);
        worldCanvas.objects = [...worldInitialValues.worldObjects];
      } else {
        throw new Error ("worldCanvas not found");
      }
  }, [worldCanvas, worldInitialValues]);

  //TODO - cal afegir resize --> redraw?
  useEffect(
    function bindWorldControllerEvents() {

      console.log("sc - add listeners");
      if (worldController && worldCanvas) {
        
        worldController.events.addEventListener(
          WorldEvents.initializeWorld,
          handleInitializeWorld
        );
        
        worldController.events.addEventListener(
          WorldEvents.startGeneration,
          () => {worldCanvas.redraw(worldController.generations.currentCreatures);}
        );
        worldController.events.addEventListener(
          WorldEvents.redraw,
          () => {worldCanvas.redraw(worldController.generations.currentCreatures);}
        );
        return () => {/*
          worldController.events.removeEventListener(
            WorldEvents.initializeWorld,
            handleInitializeWorld
          );
          */
          worldController.events.removeEventListener(
            WorldEvents.startGeneration,
            () => {worldCanvas.redraw(worldController.generations.currentCreatures);}
          );
          worldController.events.addEventListener(
            WorldEvents.redraw,
            () => {worldCanvas.redraw(worldController.generations.currentCreatures);}
          );
        };
      }
      else {
        console.log("SimulationCanvas - couldn't add listeners!! ", worldController, worldCanvas);
      }

  }, [worldController, handleInitializeWorld, worldCanvas]);
  
  return <canvas className={className} id="simCanvas" ref={canvasRef}></canvas>;
}
