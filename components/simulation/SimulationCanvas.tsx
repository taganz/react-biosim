"use client";

import WorldCanvas from "@/simulation/world/WorldCanvas";
import WorldController from "@/simulation/world/WorldController";
import {WorldEvents} from "@/simulation/events/WorldEvents";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import {worldControllerAtom, worldCreaturesAtom, worldObjectsAtom, worldInitialValuesAtom} from "./store";
import {sizeAtom, worldCanvasAtom, currentGenAtom} from "@/components/simulation/store/worldAtoms";
import WorldInitialValues from "@/simulation/world/WorldInitialValues";

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
  //const [immediateStepsCount, setImmediateStepsCount] = useAtom(immediateStepsCountAtom);
  const [worldController, setWorldController] = useAtom(worldControllerAtom);
  const worldInitialValues = useAtomValue(worldInitialValuesAtom);
  
  useEffect(
    function instantiateWorlsController() {
      const worldController = new WorldController(worldInitialValues as WorldInitialValues);
      setWorldController(worldController);
      worldController.startRun();  
      console.log("WorldController instantiated");
      // eslint-disable-next-line react-hooks/exhaustive-deps
      return () => {
        console.log("*** World destroyed ***");
        worldController.pause();
        setWorldController(null);
      }
    },[]);

  //TODO add return --> destroy canvas
  useEffect(
    function instantiateWorldCanvas() {
      if (canvasRef.current) {
        const canvas : HTMLCanvasElement = canvasRef.current;
        setWorldCanvas(new WorldCanvas(canvas, size, worldCreatures, worldObjects));
        //TODO window.addEventListener("resize", this.redrawWorldCanvas.bind(this));
      } else {
        throw new Error("Cannot found canvas");
      }
      console.log("sc - instantiate worldcanvas");
      // eslint-disable-next-line react-hooks/exhaustive-deps      
  },[]);


  //TODO - cal afegir resize --> redraw?
  useEffect(
    function bindWorldControllerEvents() {

      console.log("sc - add listeners");
      if (worldController && worldCanvas) {
        /*
        worldController.events.addEventListener(
          WorldEvents.initializeWorld,
          handleInitializeWorld
        );
        */
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
  }, [worldController, worldCanvas]);
  
  return <canvas className={className} id="simCanvas" ref={canvasRef}></canvas>;
}
