"use client";

import { useAtomValue } from "jotai";
import { worldAtom } from "../../store";
import { useCallback, useEffect, useState } from "react";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import classNames from "classnames";
import { Species } from "./Species";
import SelectedSpecies from "./SelectedSpecies";
import SpeciesButton from "./SpeciesButton";
import Creature from "@/simulation/creature/Creature";

export default function PopulationPanel() {
  const world = useAtomValue(worldAtom);

  const [species, setSpecies] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | undefined>();
  const [selectedCreature, setSelectedCreature] = useState<Creature | undefined>();
  const renderedSpecies = species.slice(0, 42);

  const onStartGeneration = useCallback(() => {
    if (!world) return;

    const creatureMap = new Map<string, Species>();

    // Create the species from the creature list
    for (
      let creatureIdx = 0;
      creatureIdx < world.currentCreatures.length;
      creatureIdx++
    ) {
      const creature = world.currentCreatures[creatureIdx];
      const genomeString = creature.genome.toDecimalString(false);

      let species: Species | undefined = creatureMap.get(genomeString);
      if (!species) {
        species = new Species(creature.genome.clone());
        creatureMap.set(genomeString, species);
      }

      species.creatures.push(creature);
    }

    // Order by population
    const newSpecies = Array.from(creatureMap.values()).sort(
      (a, b) => b.creatures.length - a.creatures.length
    );

    setSpecies(newSpecies);
  }, [world]);

  const selectCreature = useCallback(
    (creature: Creature | undefined) => {
      if (creature) {
        const newSelectedSpecies = species.find(
          (species) =>
            species.genomeKey === creature.genome.toDecimalString(false)
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
      if (world) {
        // Get creature at the mouse coordinates
        const [worldX, worldY] = world.worldCanvas.mouseEventPosToWorld(e);
        const creature = world.grid[worldX][worldY].creature;

        if (creature) {
          selectCreature(creature);
        } else {
          selectCreature(undefined);
        }
      }
    },
    [world, selectCreature]
  );

  const onMouseEnterCanvas = useCallback(() => {
    if (world && world.isPaused) {
      world.computeGrid();
    }
  }, [world]);

  const onMouseMoveCanvas = useCallback(
    (e: MouseEvent) => {
      if (world && world.isPaused) {
        const [worldX, worldY] = world.worldCanvas.mouseEventPosToWorld(e);
        world.worldCanvas.redraw(world.currentCreatures, world.objects, world.currentGen);
        world.worldCanvas.drawRectStroke(worldX, worldY, 1, 1, "rgba(0,0,0,0.5)", 1.5);
      }
    },
    [world]
  );

  // Bind world events
  useEffect(() => {
    if (world) {
      onStartGeneration();

      world.events.addEventListener(
        WorldEvents.startGeneration,
        onStartGeneration
      );

      return () => {
        world.events.removeEventListener(
          WorldEvents.startGeneration,
          onStartGeneration
        );
      };
    }
  }, [onStartGeneration, world]);

  // Bind canvas events
  useEffect(() => {
    if (world) {
      world.canvas.addEventListener("click", onClickCanvas);
      world.canvas.addEventListener("mouseenter", onMouseEnterCanvas);
      world.canvas.addEventListener("mousemove", onMouseMoveCanvas);

      return () => {
        world.canvas.removeEventListener("click", onClickCanvas);
        world.canvas.removeEventListener("mouseenter", onMouseEnterCanvas);
        world.canvas.removeEventListener("mousemove", onMouseMoveCanvas);
      };
    }
  }, [world, species, onClickCanvas, onMouseEnterCanvas, onMouseMoveCanvas]);

  const totalAliveCreatures = world?.currentCreatures.length ?? 0;
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
