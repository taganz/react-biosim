"use client";

import NumberInput from "@/components/global/inputs/NumberInput";
import { useAtom } from "jotai";
import {
  mapDesignerObjectsAtom,
  mapDesignerSelectedObjectIndexAtom,
} from "../../store/mapDesignerAtoms";
import Button from "@/components/global/Button";
import { useCallback, useEffect } from "react";
import { HealthArea } from "@/simulation/world/areas/health/HealthArea";
import { FaClone, FaTrash } from "react-icons/fa";

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

  const update = () => {
    setObjects(objects.map((obj) => obj.clone()));
  };

  const updateX = (value: number) => {
    if (selectedObject && !isNaN(value)) {
      selectedObject.x = value;
      update();
    }
  };

  const updateY = (value: number) => {
    if (selectedObject && !isNaN(value)) {
      selectedObject.y = value;
      update();
    }
  };

  const updateWidth = (value: number) => {
    if (selectedObject && !isNaN(value)) {
      selectedObject.width = value;
      update();
    }
  };

  const updateHeight = (value: number) => {
    if (selectedObject && !isNaN(value)) {
      selectedObject.height = value;
      update();
    }
  };

  const updateHealth = (value: number) => {
    if (selectedHealthArea && !isNaN(value)) {
      selectedHealthArea.health = value;
      update();
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
            <Button onClick={handleDelete} icon={<FaTrash />}>
              Delete
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
