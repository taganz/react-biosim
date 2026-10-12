"use client";

import { useAtomValue, useAtom } from "jotai";
import { worldControllerAtom, selectedSpeciesAtom, selectedCreatureAtom } from "../../store";
import { useEffect, useMemo, useState } from "react";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import classNames from "classnames";
import { Species } from "../../../../simulation/creature/Species";
import SelectedSpecies from "./SelectedSpecies";
import SpeciesButton from "./SpeciesButton";
import PopulationSummary from "./PopulationSummary";

export default function PopulationPanel() {
  const worldController = useAtomValue(worldControllerAtom);

  // bumped at the start of each generation, so the species are computed again
  const [generationKey, setGenerationKey] = useState(0);
  // shared with SimulationCanvas, which selects the species of the clicked creature
  const [selectedSpecies, setSelectedSpecies] = useAtom(selectedSpeciesAtom);
  const [selectedCreature, setSelectedCreature] = useAtom(selectedCreatureAtom);

  // selecting a species also selects one of its creatures, so its live values and ring are
  // shown. The current creature is kept when it already belongs to the species
  const selectSpecies = (clicked: Species) => {
    const keepCurrent =
      selectedCreature?.isAlive &&
      selectedCreature.brain.genome.toDecimalString(false) === clicked.genomeKey;
    setSelectedSpecies(clicked);
    if (!keepCurrent) {
      setSelectedCreature(clicked.creatures.find((creature) => creature.isAlive) ?? null);
    }
  };

  const clearSelection = () => {
    setSelectedSpecies(undefined);
    setSelectedCreature(null);
  };

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

  return (
    <div className="flex flex-col gap-6">
      <PopulationSummary speciesCount={species.length} />

      <div className="flex gap-4">
        <div className="min-w-0 grow">
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
                  isSelected ? clearSelection() : selectSpecies(species)
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
