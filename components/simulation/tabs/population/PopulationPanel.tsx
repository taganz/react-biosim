"use client";

import { useAtomValue, useAtom, useSetAtom } from "jotai";
import { worldControllerAtom, selectedSpeciesAtom, selectedCreatureAtom, selectedCellAtom, userSelectCreatureAtom } from "../../store";
import { useEffect, useMemo, useState } from "react";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import classNames from "classnames";
import { Species } from "../../../../simulation/creature/Species";
import SelectedSpecies from "./SelectedSpecies";
import SpeciesButton from "./SpeciesButton";
import PopulationSummary from "./PopulationSummary";
import CreatureIdSearch from "./CreatureIdSearch";
import SpeciesFilter from "./SpeciesFilter";
import {
  getEnabledSensorAndActionNames,
  getUsedSensorsAndActions,
} from "@/simulation/creature/brain/Helpers/networkLabels";

export default function PopulationPanel() {
  const worldController = useAtomValue(worldControllerAtom);

  // bumped at the start of each generation, so the species are computed again
  const [generationKey, setGenerationKey] = useState(0);
  // shared with SimulationCanvas, which selects the species of the clicked creature
  const [selectedSpecies, setSelectedSpecies] = useAtom(selectedSpeciesAtom);
  const [selectedCreature, setSelectedCreature] = useAtom(selectedCreatureAtom);
  const userSelectCreature = useSetAtom(userSelectCreatureAtom);
  const setSelectedCell = useSetAtom(selectedCellAtom);

  // selecting a species also selects one of its creatures, so its live values and ring are
  // shown. The current creature is kept when it already belongs to the species
  const selectSpecies = (clicked: Species) => {
    const keepCurrent =
      selectedCreature?.isAlive &&
      selectedCreature.brain.genome.toDecimalString(false) === clicked.genomeKey;
    setSelectedSpecies(clicked);
    setSelectedCell(null);
    if (!keepCurrent) {
      userSelectCreature(clicked.creatures.find((creature) => creature.isAlive) ?? null);
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

  // sensors and actions each species' network uses, for the filter
  const usedBySpecies = useMemo(
    () => new Map(species.map((s) => [s.genomeKey, getUsedSensorsAndActions(s.creatures[0])])),
    [species]
  );
  const enabledNames = useMemo(
    () =>
      species.length > 0
        ? getEnabledSensorAndActionNames(species[0].creatures[0])
        : { sensors: [], actions: [] },
    [species]
  );

  const [sensorFilter, setSensorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const filteredSpecies = species.filter((s) => {
    const used = usedBySpecies.get(s.genomeKey)!;
    return (
      (sensorFilter === "" || used.sensors.has(sensorFilter)) &&
      (actionFilter === "" || used.actions.has(actionFilter))
    );
  });
  const isFiltered = sensorFilter !== "" || actionFilter !== "";
  const renderedSpecies = filteredSpecies.slice(0, 42);

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
      <CreatureIdSearch />
      <SpeciesFilter
        sensors={enabledNames.sensors}
        actions={enabledNames.actions}
        sensor={sensorFilter}
        action={actionFilter}
        onSensorChange={setSensorFilter}
        onActionChange={setActionFilter}
        message={
          isFiltered
            ? `${filteredSpecies.length} of ${species.length} species match` +
              (filteredSpecies.length > renderedSpecies.length
                ? `, showing the ${renderedSpecies.length} largest.`
                : ".")
            : ""
        }
      />

      <div className="flex gap-4">
        <div className="min-w-0 grow">
          <SelectedSpecies selectedSpecies={selectedSpecies} />
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
