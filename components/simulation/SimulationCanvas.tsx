"use client";

import WorldCanvas from "@/simulation/world/WorldCanvas";
import WorldController from "@/simulation/world/WorldController";
import {WorldEvents} from "@/simulation/events/WorldEvents";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import {worldCanvasAtom, simulationDataAtom, worldControllerAtom, eventLoggerAtom, selectedCreatureAtom, selectedSpeciesAtom} from "./store";
import { Species } from "@/simulation/creature/Species";
import { STARTUP_MODE } from "@/simulation/simulationDataDefault";
import { startUpScenarioSimulationData } from "../../simulation/startupScenario";
import { SIMULATION_DATA_DEFAULT } from "@/simulation/simulationDataDefault";
import { SimulationData } from "@/simulation/SimulationData";
//import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
//import EventLogger from "@/simulation/logger/EventLogger";

interface Props {
  className?: string;
}

export default function SimulationCanvas({ className }: Props) {
  const canvasRef = useRef(null);
  // transparent canvas on top of the world for marks that must not be saved in GIFs or images
  const overlayRef = useRef<HTMLCanvasElement>(null);
  //const counter = useRef(0);
  //const counterMax = useRef(0);
  //const worldCreatures = useAtomValue(worldCreaturesAtom);
  const [worldCanvas, setWorldCanvas] = useAtom(worldCanvasAtom);
  //const [immediateStepsCount, setImmediateStepsCount] = useAtom(immediateStepsCountAtom);
  const [worldController, setWorldController] = useAtom(worldControllerAtom);
  const setEventLogger = useSetAtom(eventLoggerAtom);
  const [selectedCreature, setSelectedCreature] = useAtom(selectedCreatureAtom);
  const setSelectedSpecies = useSetAtom(selectedSpeciesAtom);
  const [simulationData, setSimulationData] = useAtom(simulationDataAtom);

  useEffect(
    function instantiateWorld() {

      let simData : SimulationData;
      if (STARTUP_MODE=="startupScenario") {
        simData = startUpScenarioSimulationData;
      } else {
        simData = SIMULATION_DATA_DEFAULT;
      }

      let worldController = new WorldController(simData);
      const simCode = worldController.startRun(simData);  
      simData.worldControllerData.simCode = simCode;
      
      setWorldController(worldController);
      setEventLogger(worldController.eventLogger);
      setSimulationData(simData);

      if (canvasRef.current) {
        const canvas : HTMLCanvasElement = canvasRef.current;
        setWorldCanvas(new WorldCanvas(worldController, canvas));
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
        setEventLogger(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

  //TODO - cal afegir resize --> redraw?
  useEffect(
    function bindWorldControllerEvents() {

      if (worldController && worldCanvas) {        

   //     const initializeWorldCallback = () => {
   //       setEventLogger(worldController.eventLogger);
   //     };
  
        const startGenerationCallback = () => {
          worldCanvas.redraw();
        };
  
        const redrawCallback = () => {
          worldCanvas.redraw();
        };
  
  
    //    worldController.events.addEventListener(WorldEvents.initializeWorld,initializeWorldCallback);
        worldController.events.addEventListener(WorldEvents.startGeneration,startGenerationCallback);
        worldController.events.addEventListener(WorldEvents.redraw,redrawCallback);
        console.log("SimulationCanvas addEventListeners");
        
      return () => {
    //    worldController.events.removeEventListener(WorldEvents.initializeWorld,initializeWorldCallback);
        worldController.events.removeEventListener(WorldEvents.startGeneration,startGenerationCallback);
        worldController.events.removeEventListener(WorldEvents.redraw, redrawCallback);
      };
    }

  }, [worldController, worldCanvas, setEventLogger]);

  // Creature selection lives here (not in a tab) so it works whatever tab is open
  useEffect(
    function bindCanvasMouseEvents() {
      if (!worldController || !worldCanvas) return;

      const onClick = (e: MouseEvent) => {
        const [worldX, worldY] = worldCanvas.mouseEventPosToWorld(e);
        const creature = worldController.grid.cell(worldX, worldY).creature;
        setSelectedCreature(creature ?? null);
        setSelectedSpecies(
          creature ? new Species(creature.brain.genome.clone(), [creature]) : undefined
        );
      };

      // draw a small square at cursor position to help selecting a creature
      const onMouseMove = (e: MouseEvent) => {
        if (worldController.isPaused) {
          const [worldX, worldY] = worldCanvas.mouseEventPosToWorld(e);
          worldCanvas.redraw();
          worldCanvas.drawRectStroke(worldX, worldY, 1, 1, "rgba(0,0,0,0.5)", 1.5);
        }
      };

      worldCanvas.canvas.addEventListener("click", onClick);
      worldCanvas.canvas.addEventListener("mousemove", onMouseMove);
      return () => {
        worldCanvas.canvas.removeEventListener("click", onClick);
        worldCanvas.canvas.removeEventListener("mousemove", onMouseMove);
      };
    },
    [worldController, worldCanvas, setSelectedCreature, setSelectedSpecies]
  );

  // ring around the selected creature, drawn on the overlay whenever the world is redrawn
  // and right away when the selection changes (also while the simulation is paused)
  useEffect(
    function highlightSelectedCreature() {
      const overlay = overlayRef.current;
      if (!worldController || !worldCanvas || !overlay) return;

      const drawSelection = () => worldCanvas.drawSelectionOverlay(overlay, selectedCreature);
      const events = [WorldEvents.redraw, WorldEvents.startGeneration, WorldEvents.initializeWorld];

      drawSelection();
      events.forEach((event) => worldController.events.addEventListener(event, drawSelection));
      return () => {
        events.forEach((event) => worldController.events.removeEventListener(event, drawSelection));
      };
    },
    [worldController, worldCanvas, selectedCreature]
  );

  return (
    // self-start: as a grid item the wrapper would stretch to the height of the tabs column
    <div className="relative self-start">
      {/* block, so the wrapper has exactly the canvas height and the overlay lines up */}
      <canvas className={`block ${className ?? ""}`} id="simCanvas" ref={canvasRef}></canvas>
      <canvas
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0"
      ></canvas>
    </div>
  );
}
