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
import {worldInitialValuesAtom, restartAtom, worldAtom} from "./store";
import {worldObjectsAtom} from "./store/worldAtoms";
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
  sizeAtom,
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
  const worldInitialValues = useAtomValue(worldInitialValuesAtom);
  const size = worldInitialValues.sizeAtom;
  const stepsPerGen = worldInitialValues.stepsPerGenAtom;
  const initialPopulation = worldInitialValues.initialPopulationAtom;
  const initialGenomeSize = worldInitialValues.initialGenomeSizeAtom;
  const maxGenomeSize = worldInitialValues.maxGenomeSizeAtom;
  const maxNeurons = worldInitialValues.maxNeuronsAtom;
  const mutationMode = worldInitialValues.mutationModeAtom;
  const mutationProbability = worldInitialValues.mutationProbabilityAtom;
  const geneInsertionDeletionProbability = worldInitialValues.geneInsertionDeletionProbabilityAtom;
  const enabledSensors = worldInitialValues.enabledSensorsAtom;
  const enabledActions = worldInitialValues.enabledActionsAtom;
  const worldObjects = useAtomValue(worldObjectsAtom);

  
  // Function to set initial values
  const applyInitialValues = useCallback(
    (world: World) => {
      // Map
      world.size = size;
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

      // map objects
      world.objects = worldObjects;
  
    },
    [size, stepsPerGen, enabledSensors, enabledActions, initialPopulation, initialGenomeSize, maxGenomeSize, maxNeurons, mutationMode, mutationProbability, geneInsertionDeletionProbability, worldObjects]
  );

  // Instantiate the world
  // RD 10/3/24 - It seems like it enters here twice when initialized. It enters, destroys the world, and enters again ??
  //   -- li falta una dependencia???
  useEffect(() => {
    // Create world and store it
    const world = new World(canvas.current, 100);
    setWorld(world);

    applyInitialValues(world);
 
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
