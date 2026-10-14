"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { worldControllerAtom, selectedCreatureAtom, selectedSpeciesAtom, selectedCellAtom } from "../../store";
import useWorldValue from "@/hooks/useWorldValue";
import { GridPosition } from "@/simulation/world/grid/Grid";
import WorldObject from "@/simulation/world/objects/WorldObject";
import { Species } from "@/simulation/creature/Species";
import { Group, Field, Meter } from "./SelectedCreatureInfo";

interface Props {
  position: GridPosition;
}

const AREA_LABELS: Record<number, string> = {
  0: "reproduction area",
  1: "health area",
  2: "spawn area",
};

function objectLabel(obj: WorldObject): string {
  return obj.areaType === undefined ? "obstacle" : AREA_LABELS[obj.areaType] ?? `area ${obj.areaType}`;
}

// The water and map objects of a cell clicked on the world, read again on every step
export default function SelectedCellInfo({ position }: Props) {
  const worldController = useAtomValue(worldControllerAtom);
  const setSelectedCreature = useSetAtom(selectedCreatureAtom);
  const setSelectedSpecies = useSetAtom(selectedSpeciesAtom);
  const setSelectedCell = useSetAtom(selectedCellAtom);
  // these subscriptions only make the component re-render as the simulation advances
  useWorldValue((world) => world.currentStep, 0);
  useWorldValue((world) => world.currentGen, 0);

  const [x, y] = position;
  const grid = worldController?.grid;
  // a restart with a smaller world can leave the position outside
  if (!grid || !grid.isTileInsideWorld(x, y)) {
    return <p className="text-sm">This cell is not in the world anymore.</p>;
  }
  const cell = grid.cell(x, y);
  const creature = cell.creature;

  const selectCreature = () => {
    if (!creature) return;
    setSelectedCreature(creature);
    setSelectedSpecies(new Species(creature.brain.genome.clone(), [creature]));
    setSelectedCell(null);
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-4">
      <Group title="Cell">
        <Field label="Position">({x}, {y})</Field>
        <Field label="Contents">
          {creature ? (
            <button className="underline hover:bg-grey-mid" onClick={selectCreature}>
              creature #{creature.id}
            </button>
          ) : cell.isSolid ? "obstacle" : "empty"}
        </Field>
        <Field label="Map objects">
          {cell.objects.length > 0 ? cell.objects.map(objectLabel).join(", ") : "none"}
        </Field>
        <Field label="Water">
          <Meter
            value={cell.water}
            max={cell.waterCapacity}
            text={`${cell.water.toFixed(2)} / ${cell.waterCapacity.toFixed(2)}`}
          />
        </Field>
      </Group>
    </div>
  );
}
