"use client";

import { useAtomValue, useSetAtom } from "jotai";
import Button from "@/components/global/Button";
import useWorldValue from "@/hooks/useWorldValue";
import { Species } from "@/simulation/creature/Species";
import { selectedSpeciesAtom, userSelectCreatureAtom, worldControllerAtom } from "../../store";

interface Props {
  species: Species;
}

// Where a species comes from: the species its first creature was born from with a mutation
export default function SpeciesLineage({ species }: Props) {
  const worldController = useAtomValue(worldControllerAtom);
  const setSelectedSpecies = useSetAtom(selectedSpeciesAtom);
  const userSelectCreature = useSetAtom(userSelectCreatureAtom);
  const firstGen = useWorldValue(
    (world) => world.generations.speciesRegistry.firstGenOf(species.id) ?? species.firstGen ?? 0,
    0
  );
  const parentAlive = useWorldValue(
    (world) => species.parentId !== null
      && world.generations.currentCreatures.some((creature) => creature.isAlive && creature.speciesId === species.parentId),
    false
  );

  const selectParentSpecies = () => {
    if (!worldController || species.parentId === null) return;
    const creature = worldController.generations.currentCreatures.find(
      (other) => other.isAlive && other.speciesId === species.parentId
    );
    if (!creature) return;
    setSelectedSpecies(Species.of(creature));
    userSelectCreature(creature);
  };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
      <span>
        {species.parentId === null
          ? "A root species: it does not come from another one."
          : <>Came from species <span className="font-mono">{species.parentId}</span>.</>}
        {firstGen > 0 && ` Appeared in generation ${firstGen}.`}
      </span>
      {species.parentId !== null && (
        <Button
          onClick={selectParentSpecies}
          disabled={!parentAlive}
          title={parentAlive ? "Select the species it came from" : "The species it came from has no living creatures"}
        >
          Select parent species
        </Button>
      )}
    </div>
  );
}
