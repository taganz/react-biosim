"use client";

import AsexualZonePopulation from "@/simulation/creature/population/AsexualZonePopulation";
//import AsexualRandomPopulation from "@/simulation/creature/population/AsexualRandomPopulation";
import InsideReproductionAreaSelection from "@/simulation/creature/selection/InsideReproductionAreaSelection";
import World from "@/simulation/world/World";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import RectangleObject from "@/simulation/world/objects/RectangleObject";
import { useAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import {
  enabledActionsAtom,
  enabledSensorsAtom,
  geneInsertionDeletionProbabilityAtom,
  initialGenomeSizeAtom,
  initialPopulationAtom,
  maxGenomeSizeAtom,
  maxNeuronsAtom,
  mutationModeAtom,
  mutationProbabilityAtom,
  restartAtom,
  worldAtom,
  worldSizeAtom,
  stepsPerGenAtom,
} from "./store";

interface Props {
  className?: string;
}

export default function SimulationCanvas({ className }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [world, setWorld] = useAtom(worldAtom);

  const [shouldRestart, setShouldRestart] = useAtom(restartAtom);

  // Initial settings
  const worldSize = useAtomValue(worldSizeAtom);
  const stepsPerGen = useAtomValue(stepsPerGenAtom);
  const initialPopulation = useAtomValue(initialPopulationAtom);
  const initialGenomeSize = useAtomValue(initialGenomeSizeAtom);
  const maxGenomeSize = useAtomValue(maxGenomeSizeAtom);
  const maxNeurons = useAtomValue(maxNeuronsAtom);
  const mutationMode = useAtomValue(mutationModeAtom);
  const mutationProbability = useAtomValue(mutationProbabilityAtom);
  const geneInsertionDeletionProbability = useAtomValue(
    geneInsertionDeletionProbabilityAtom
  );
  const enabledSensors = useAtomValue(enabledSensorsAtom);
  const enabledActions = useAtomValue(enabledActionsAtom);

  // Function to set initial values
  const applyInitialValues = useCallback(
    (world: World) => {
      // Map
      world.size = worldSize;
      world.stepsPerGen = stepsPerGen;

      // Sensors and actions
      world.sensors.loadFromList(enabledSensors);
      world.actions.loadFromList(enabledActions);

      // Population

       // RD 1/3/24  -- see also World
      world.populationStrategy = new AsexualZonePopulation(); 
      //world.populationStrategy = new AsexualRandomPopulation();
      world.initialPopulation = initialPopulation;
      
      world.selectionMethod = new InsideReproductionAreaSelection();

      // Neural networks
      world.initialGenomeSize = initialGenomeSize;
      world.maxGenomeSize = maxGenomeSize;
      world.maxNumberNeurons = maxNeurons;

      // Mutations
      world.mutationMode = mutationMode;
      world.mutationProbability = mutationProbability;
      world.geneInsertionDeletionProbability = geneInsertionDeletionProbability;
      world.deletionRatio = 0.5;
    },
    [worldSize, stepsPerGen, enabledSensors, enabledActions, initialPopulation, initialGenomeSize, maxGenomeSize, maxNeurons, mutationMode, mutationProbability, geneInsertionDeletionProbability]
  );

  // Instantiate the world
  useEffect(() => {
    // Create world and store it
    const world = new World(canvas.current, 100);
    setWorld(world);

    applyInitialValues(world);


    const objectsPredef1 = [
      // A reproduction zone at the center
      new RectangleReproductionArea(0.25, 0.25, 0.5, 0.5, true),
      // A map divided in two sections by 5 squares
      new RectangleObject(0, 0, 0.2, 0.2),
      new RectangleObject(0.2, 0.2, 0.2, 0.2),
      new RectangleObject(0.4, 0.4, 0.2, 0.2),
      new RectangleObject(0.6, 0.6, 0.2, 0.2),
      new RectangleObject(0.8, 0.8, 0.2, 0.2),
      // A spawn zone at the center
      new RectangleSpawnArea(0.4, 0.4, 0.2, 0.2, true),
    ];

    
    const objectsPredef2 = [
      // A spawn zone at top left
      new RectangleSpawnArea(0.1, 0.1, 0.2, 0.2, true),
      // A reproduction zone at  center
      new RectangleReproductionArea(0.3, 0.6, 0.2, 0.4, true),
      // A map divided at bottom by 5 columns
      new RectangleObject(0.1, 0.6, 0.04, 0.4),
      new RectangleObject(0.3, 0.6, 0.04, 0.4),
      new RectangleObject(0.5, 0.6, 0.04, 0.4),
      new RectangleObject(0.7, 0.6, 0.04, 0.4),
      new RectangleObject(0.9, 0.6, 0.04, 0.4),
      
    ];

    world.objects = objectsPredef2;

    // Initialize world and start simulation
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

  const restartSimulation = useCallback(() => {
    if (world) {
      const isPaused = world.isPaused;
      applyInitialValues(world);
      world.initializeWorld(true);

      if (!isPaused) {
        world.startRun();
      }
    }
  }, [applyInitialValues, world]);

  // Restart the simulation
  useEffect(() => {
    if (shouldRestart) {
      restartSimulation();
      setShouldRestart(false);
    }
  }, [restartSimulation, setShouldRestart, shouldRestart]);

  return <canvas className={className} ref={canvas}></canvas>;
}
