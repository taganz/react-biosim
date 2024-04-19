"use client";

import { useAtomValue } from "jotai";
import { worldControllerAtom, worldCanvasAtom } from "../../store";
import { useCallback, useEffect, useState } from "react";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import classNames from "classnames";
import { Species } from "./Species";
import SelectedSpecies from "./SelectedSpecies";
import SpeciesButton from "./SpeciesButton";
import Creature from "@/simulation/creature/Creature";
//import { GridPosition } from "@/simulation/world/grid/Grid";

export default function PopulationPanel() {
  const worldController = useAtomValue(worldControllerAtom);
  const worldCanvas = useAtomValue(worldCanvasAtom);

  const [species, setSpecies] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | undefined>();
  const [selectedCreature, setSelectedCreature] = useState<Creature | undefined>();
  const renderedSpecies = species.slice(0, 42);

  const onStartGeneration = useCallback(() => {
    if (!worldController) return;

    const creatureMap = new Map<string, Species>();

    // Create the species from the creature list
    for (
      let creatureIdx = 0;
      creatureIdx < worldController.generations.currentCreatures.length;
      creatureIdx++
    ) {
      const creature = worldController.generations.currentCreatures[creatureIdx];
      const genomeString = creature.brain.genome.toDecimalString(false);

      let species: Species | undefined = creatureMap.get(genomeString);
      if (!species) {
        species = new Species(creature.brain.genome.clone());
        creatureMap.set(genomeString, species);
      }

      species.creatures.push(creature);
    }

    // Order by population
    const newSpecies = Array.from(creatureMap.values()).sort(
      (a, b) => b.creatures.length - a.creatures.length
    );

    setSpecies(newSpecies);
  }, [worldController]);

  const selectCreature = useCallback(
    (creature: Creature | undefined) => {
      if (creature) {
        const newSelectedSpecies = species.find(
          (species) =>
            species.genomeKey === creature.brain.genome.toDecimalString(false)
        );

        setSelectedSpecies(newSelectedSpecies);
        setSelectedCreature(creature);
      } else {
        setSelectedSpecies(undefined);
        setSelectedCreature(undefined);
      }
    },
    [species]
  );

  const onClickCanvas = useCallback(
    (e: MouseEvent) => {
      if (worldController && worldCanvas) {
        // Get creature at the mouse coordinates
        const [worldX, worldY] = worldCanvas.mouseEventPosToWorld(e);
        const creature = worldController.grid.cell(worldX, worldY).creature;

        if (creature) {
          selectCreature(creature);
        } else {
          selectCreature(undefined);
        }
      } else {
          throw new Error ("something missing here...")
      }
    },
    [worldController, worldCanvas, selectCreature]
  );

  const onMouseEnterCanvas = useCallback(() => {
    if (worldController && worldController.isPaused) {
        //TODO investigar que era aixo
   //   worldController.computeGrid();
    }
  }, [worldController]);

  // draw a small square at cursor position to select creature
  const onMouseMoveCanvas = useCallback(
    (e: MouseEvent) => {
      if (worldCanvas)  {
        if (worldController && worldController.isPaused) {
          const [worldX, worldY] = worldCanvas.mouseEventPosToWorld(e);
          worldCanvas.redraw();
          worldCanvas.drawRectStroke(worldX, worldY, 1, 1, "rgba(0,0,0,0.5)", 1.5);
        }
      } else {
        throw new Error ("worldCanvas not found");
      }
    },
    [worldController, worldCanvas]
  );

  // Bind worldController events
  useEffect(() => {
    if (worldController) {
      onStartGeneration();

      worldController.events.addEventListener(
        WorldEvents.startGeneration,
        onStartGeneration
      );

      return () => {
        worldController.events.removeEventListener(
          WorldEvents.startGeneration,
          onStartGeneration
        );
      };
    }
  }, [onStartGeneration, worldController]);

  // Bind canvas events
  useEffect(() => {
    if (worldCanvas) {
      worldCanvas.canvas.addEventListener("click", onClickCanvas);
      worldCanvas.canvas.addEventListener("mouseenter", onMouseEnterCanvas);
      worldCanvas.canvas.addEventListener("mousemove", onMouseMoveCanvas);

      return () => {
        worldCanvas.canvas.removeEventListener("click", onClickCanvas);
        worldCanvas.canvas.removeEventListener("mouseenter", onMouseEnterCanvas);
        worldCanvas.canvas.removeEventListener("mousemove", onMouseMoveCanvas);
      };
    } else {
      throw new Error("worldCanvas not found");
    }
    
  }, [worldCanvas, species, onClickCanvas, onMouseEnterCanvas, onMouseMoveCanvas]);

  const totalAliveCreatures = worldController?.generations.currentCreatures.length ?? 0;
  const totalSpeciesAlive = species.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="lg:text-lg">
          <strong>Total alive creatures:</strong> {totalAliveCreatures}
        </div>
        <div className="lg:text-lg">
          <strong>Total species alive:</strong> {totalSpeciesAlive}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="grow">
          <SelectedSpecies
            species={species}
            selectedSpecies={selectedSpecies}
          />
        </div>

        <div
          className={classNames(
            "inline-grid shrink-0 overflow-y-auto pr-2 lg:grid-cols-2 2xl:grid-cols-3",
            "h-fit max-h-[75vh] lg:max-h-[65vh]"
          )}
        >
          {renderedSpecies.map((species) => {
            const { genomeKey } = species;
            const isSelected = selectedSpecies?.genomeKey === genomeKey;

            return (
              <SpeciesButton
                key={species.genomeKey}
                species={species}
                isSelected={isSelected}
                onClick={() =>
                  isSelected
                    ? setSelectedSpecies(undefined)
                    : setSelectedSpecies(species)
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
