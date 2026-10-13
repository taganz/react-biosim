"use client";

import WorldCanvas from "@/simulation/world/WorldCanvas";
import WorldController from "@/simulation/world/WorldController";
import {WorldEvents} from "@/simulation/events/WorldEvents";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import {worldCanvasAtom, simulationDataAtom, worldControllerAtom, eventLoggerAtom, selectedCreatureAtom, selectedSpeciesAtom} from "./store";
import { showWaterAtom } from "./store/guiControlsAtoms";
import { Species } from "@/simulation/creature/Species";
import Creature from "@/simulation/creature/Creature";
import type { Gene } from "@/simulation/creature/brain/Genome";
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
  const showWater = useAtomValue(showWaterAtom);

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

  // the water layer is a viewer option from Stats → Water; redraws at once, also while paused
  useEffect(
    function syncShowWater() {
      worldCanvas?.setShowWater(showWater);
    },
    [worldCanvas, showWater]
  );

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

  // the creatures are replaced at the start of each generation, so the selection moves to a
  // creature of the same species. Offspring mutate often, so when no creature has the exact
  // genome, the closest relative (most genes in common) and its species are selected instead
  const selectedCreatureRef = useRef(selectedCreature);
  useEffect(() => {
    selectedCreatureRef.current = selectedCreature;
  }, [selectedCreature]);
  useEffect(
    function followSelectedSpecies() {
      if (!worldController) return;

      const onStartGeneration = () => {
        const previous = selectedCreatureRef.current;
        if (!previous) return;
        const candidates = worldController.generations.currentCreatures.filter((creature) => creature.isAlive);

        const genomeKey = previous.brain.genome.toDecimalString(false);
        const sameSpecies = candidates.find(
          (creature) => creature.brain.genome.toDecimalString(false) === genomeKey
        );
        if (sameSpecies) {
          setSelectedCreature(sameSpecies);
          return;
        }

        let closest: Creature | null = null;
        let closestShared = 0;
        for (const creature of candidates) {
          const shared = sharedGenes(previous.brain.genome.genes, creature.brain.genome.genes);
          if (shared > closestShared) {
            closest = creature;
            closestShared = shared;
          }
        }
        setSelectedCreature(closest);
        setSelectedSpecies(closest ? new Species(closest.brain.genome.clone(), [closest]) : undefined);
      };

      worldController.events.addEventListener(WorldEvents.startGeneration, onStartGeneration);
      return () => {
        worldController.events.removeEventListener(WorldEvents.startGeneration, onStartGeneration);
      };
    },
    [worldController, setSelectedCreature, setSelectedSpecies]
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

// number of genes two genomes have in common, counting repeated genes once per occurrence
function sharedGenes(a: Gene[], b: Gene[]): number {
  const counts = new Map<Gene, number>();
  a.forEach((gene) => counts.set(gene, (counts.get(gene) ?? 0) + 1));
  let shared = 0;
  for (const gene of b) {
    const count = counts.get(gene) ?? 0;
    if (count > 0) {
      shared++;
      counts.set(gene, count - 1);
    }
  }
  return shared;
}
