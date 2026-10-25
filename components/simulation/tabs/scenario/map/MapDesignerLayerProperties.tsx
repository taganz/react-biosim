"use client";

import NumberInput from "@/components/global/inputs/NumberInput";
import { useAtom } from "jotai";
import {
  mapDesignerObjectsAtom,
  mapDesignerSelectedObjectIndexAtom,
} from "../../../store/mapDesignerAtoms";
import Button from "@/components/global/Button";
import { useCallback, useEffect } from "react";
import { HealthArea } from "@/simulation/world/areas/health/HealthArea";
import WorldObject from "@/simulation/world/objects/WorldObject";
import { FaArrowDown, FaArrowUp, FaClone, FaTrash } from "react-icons/fa";

export default function MapDesignerLayerProperties() {
  const [objects, setObjects] = useAtom(mapDesignerObjectsAtom);
  const [selectedObjectIndex, setSelectedObjectIndex] = useAtom(
    mapDesignerSelectedObjectIndexAtom
  );

  const selectedObject =
    selectedObjectIndex !== undefined
      ? objects[selectedObjectIndex]
      : undefined;

  const castedHealthArea = selectedObject as HealthArea;
  const selectedHealthArea =
    selectedObject && "health" in castedHealthArea
      ? castedHealthArea
      : undefined;

  // the objects are atom state: change a clone of the selected one
  const update = (change: (obj: WorldObject) => void) => {
    setObjects(
      objects.map((obj, index) => {
        const copy = obj.clone();
        if (index === selectedObjectIndex) change(copy);
        return copy;
      })
    );
  };

  const updateX = (value: number) => {
    if (selectedObject && !isNaN(value)) {
      update((obj) => (obj.x = value));
    }
  };

  const updateY = (value: number) => {
    if (selectedObject && !isNaN(value)) {
      update((obj) => (obj.y = value));
    }
  };

  const updateWidth = (value: number) => {
    if (selectedObject && !isNaN(value)) {
      update((obj) => (obj.width = value));
    }
  };

  const updateHeight = (value: number) => {
    if (selectedObject && !isNaN(value)) {
      update((obj) => (obj.height = value));
    }
  };

  const updateHealth = (value: number) => {
    if (selectedHealthArea && !isNaN(value)) {
      update((obj) => ((obj as HealthArea).health = value));
    }
  };

  const handleDelete = useCallback(() => {
    setSelectedObjectIndex(undefined);
    setObjects(objects.filter((_, index) => index !== selectedObjectIndex));
  }, [objects, selectedObjectIndex, setObjects, setSelectedObjectIndex]);

  const handleClone = () => {
    if (selectedObjectIndex !== undefined && selectedObject) {
      const newObjects = [...objects];
      newObjects.splice(selectedObjectIndex, 0, selectedObject.clone());
      setObjects(newObjects);
      setSelectedObjectIndex(selectedObjectIndex + 1);
    }
  };

  // Objects later in the list are drawn on top
  const handleMove = (toFront: boolean) => {
    if (selectedObjectIndex !== undefined && selectedObject) {
      const newObjects = objects.filter((_, index) => index !== selectedObjectIndex);
      if (toFront) newObjects.push(selectedObject);
      else newObjects.unshift(selectedObject);
      setObjects(newObjects);
      setSelectedObjectIndex(toFront ? newObjects.length - 1 : 0);
    }
  };

  const deleteHandler = useCallback(
    ({ key }: KeyboardEvent) => {
      if (key === "Delete") {
        handleDelete();
      }
    },
    [handleDelete]
  );

  useEffect(() => {
    window.addEventListener("keyup", deleteHandler);
    return () => {
      window.removeEventListener("keyup", deleteHandler);
    };
  }, [deleteHandler]);

  return (
    <div>
      {selectedObject && (
        <>
          <h4>
            <strong>Type:</strong> {selectedObject.name}
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
              label="X"
              value={selectedObject.x}
              onChange={updateX}
              step={0.01}
            />
            <NumberInput
              label="Y"
              value={selectedObject.y}
              onChange={updateY}
              step={0.01}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
              label="Width"
              value={selectedObject.width}
              onChange={updateWidth}
              step={0.01}
            />
            <NumberInput
              label="Height"
              value={selectedObject.height}
              onChange={updateHeight}
              step={0.01}
            />
          </div>

          {selectedHealthArea && (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput
                label="Health"
                value={selectedHealthArea.health}
                onChange={updateHealth}
                step={0.25}
              />
            </div>
          )}

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button onClick={handleClone} variant="grey" icon={<FaClone />}>
              Clone
            </Button>
            <Button variant="danger" onClick={handleDelete} icon={<FaTrash />}>
              Delete
            </Button>
            <Button onClick={() => handleMove(true)} variant="grey" icon={<FaArrowUp />}>
              To front
            </Button>
            <Button onClick={() => handleMove(false)} variant="grey" icon={<FaArrowDown />}>
              To back
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
