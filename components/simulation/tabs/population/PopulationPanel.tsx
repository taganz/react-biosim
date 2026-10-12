"use client";

import { useAtomValue, useAtom } from "jotai";
import { worldControllerAtom, selectedSpeciesAtom } from "../../store";
import { useEffect, useMemo, useState } from "react";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import classNames from "classnames";
import { Species } from "../../../../simulation/creature/Species";
import SelectedSpecies from "./SelectedSpecies";
import SpeciesButton from "./SpeciesButton";

export default function PopulationPanel() {
  const worldController = useAtomValue(worldControllerAtom);

  // bumped at the start of each generation, so the species are computed again
  const [generationKey, setGenerationKey] = useState(0);
  // shared with SimulationCanvas, which selects the species of the clicked creature
  const [selectedSpecies, setSelectedSpecies] = useAtom(selectedSpeciesAtom);

  // create species[], order by population
  const species = useMemo(() => {
    if (!worldController) return [];

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

    return newSpecies;
    // generationKey is not read, but a new generation has new creatures
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldController, generationKey]);
  const renderedSpecies = species.slice(0, 42);

  // Bind worldController events
  useEffect(() => {
    if (worldController) {
      const onStartGeneration = () => setGenerationKey((key) => key + 1);

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
  }, [worldController]);

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
