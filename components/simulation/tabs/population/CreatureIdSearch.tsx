"use client";

import { FormEvent, useId, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Species } from "@/simulation/creature/Species";
import Button from "@/components/global/Button";
import useWorldValue from "@/hooks/useWorldValue";
import { findLivingCreatureById } from "@/simulation/generations/creatureQueries";
import {
  selectedCellAtom,
  selectedCreatureAtom,
  selectedSpeciesAtom,
  waitForCreatureTextAtom,
  worldControllerAtom,
} from "../../store";

// Selects a living creature by its id, like clicking it in the world. If it is not alive,
// the simulation waits for it: SimulationCanvas selects it when it is born, and the run pauses.
// The field is emptied once the creature is selected, on Stop waiting, and when the user selects
// another creature (userSelectCreatureAtom)
export default function CreatureIdSearch() {
  const worldController = useAtomValue(worldControllerAtom);
  const setSelectedCreature = useSetAtom(selectedCreatureAtom);
  const setSelectedSpecies = useSetAtom(selectedSpeciesAtom);
  const setSelectedCell = useSetAtom(selectedCellAtom);
  const id = useId();
  const [text, setText] = useAtom(waitForCreatureTextAtom);
  const [message, setMessage] = useState("");
  const watchedId = useWorldValue((world) => world.watchedCreatureId, null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!worldController) return;
    const creatureId = Number(text);
    if (text.trim() === "" || !Number.isInteger(creatureId) || creatureId < 1) {
      setMessage("Type a whole number of at least 1.");
      return;
    }
    const creature = findLivingCreatureById(worldController.generations, creatureId);
    if (!creature) {
      worldController.watchCreatureId(creatureId);
      setMessage("");
      return;
    }
    worldController.watchCreatureId(null);
    setSelectedCreature(creature);
    setSelectedSpecies(new Species(creature.brain.genome.clone(), [creature]));
    setSelectedCell(null);
    setText("");
    setMessage("");
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="text-sm">
          Select creature id
        </label>
        <input
          id={id}
          type="number"
          min={1}
          step={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setMessage("");
          }}
          aria-describedby={`${id}-message`}
          className="w-24 bg-grey-mid p-1 text-sm"
        />
        <Button type="submit">Select</Button>
        {watchedId !== null && (
          <Button
            onClick={() => {
              worldController?.watchCreatureId(null);
              setText("");
            }}
          >
            Stop waiting
          </Button>
        )}
      </div>
      <p id={`${id}-message`} role="status" className="text-xs">
        {message ||
          (watchedId !== null &&
            `Creature #${watchedId} is not alive. It will be selected when it is born, and the simulation will pause.`)}
      </p>
    </form>
  );
}
