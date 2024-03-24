"use client";

import World from "@/simulation/world/World";
import { useAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import {worldObjectsAtom, restartCountAtom, worldInitialValuesAtom, restartAtom, worldAtom} from "./store";

interface Props {
  className?: string;
}

export default function SimulationCanvas({ className }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [world, setWorld] = useAtom(worldAtom);
  const [shouldRestart, setShouldRestart] = useAtom(restartAtom);
  const [restartCount, setRestartCount] = useAtom(restartCountAtom);
  const worldInitialValues = useAtomValue(worldInitialValuesAtom);
  
  
  // Function to set initial values
  const applyInitialValues = useCallback((world: World) => {
      // Map
      world.size = worldInitialValues.sizeAtom;
      world.stepsPerGen = worldInitialValues.stepsPerGenAtom;

      // Sensors and actions
      world.sensors.loadFromList(worldInitialValues.enabledSensorsAtom);
      world.actions.loadFromList(worldInitialValues.enabledActionsAtom);

      // Population

      world.populationStrategy = worldInitialValues.populationStrategyAtom;;
      console.log("world.populationStrategy: ", world.populationStrategy.constructor.name);
      world.initialPopulation = worldInitialValues.initialPopulationAtom;
      
      //world.selectionMethod = new InsideReproductionAreaSelection();
      world.selectionMethod = worldInitialValues.selectionMethodAtom;
      console.log("world.selectionMethod: ", world.selectionMethod.constructor.name);

      // Neural networks
      world.initialGenomeSize = worldInitialValues.initialGenomeSizeAtomSizeAtom;;
      world.maxGenomeSize = worldInitialValues.maxGenomeSizeAtom;
      world.maxNumberNeurons = worldInitialValues.maxNeuronsAtom;

      // Mutations
      world.mutationMode = worldInitialValues.mutationModeAtom;
      world.mutationProbability = worldInitialValues.mutationProbabilityAtom;;
      world.geneInsertionDeletionProbability = worldInitialValues.geneInsertionDeletionProbabilityAtom;
      world.deletionRatio = 0.5;

      // map objects
      world.objects = worldInitialValues.worldObjectsAtom;
  
    },
    [worldInitialValues]
  );

  // Instantiate the world
  useEffect(() => {
    // Create world and store it
    const world = new World(canvas.current, worldInitialValues.sizeAtom);
    setWorld(world);

    // Initialize world and start simulation
    applyInitialValues(world);
    world.initializeWorld(true);
    world.startRun();
    console.log("World instantiated");

    return () => {
      console.log("World destroyed");
      setWorld(null);
      world.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --> treure callback si tinc el restartCount?
  const restartSimulation = useCallback(() => {
    if (world) {
      const isPaused = world.isPaused;
      applyInitialValues(world);
      world.initializeWorld(true);
    
      setRestartCount((e)=> e+1);
      console.log("restart # ", restartCount);
        
      
      if (!isPaused) {
        world.startRun();
        }
    }
  }, [applyInitialValues, world, restartCount, setRestartCount]);

  // Restart the simulation
  useEffect(() => {
    if (shouldRestart) {
      restartSimulation();
      setShouldRestart(false);
    }
  }, [restartSimulation, setShouldRestart, shouldRestart]);

  return <canvas className={className} ref={canvas}></canvas>;
}
