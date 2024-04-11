import { worldControllerAtom } from "@/components/simulation/store";
import WorldController from "@/simulation/world/WorldController";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useInterval } from "react-use";

export default function useWorldPropertyValue<T>(
  getter: (worldController: WorldController) => T,
  defaultValue: T,
  compare?: (a: T, b: T) => boolean
) {
  const worldController = useAtomValue(worldControllerAtom);
  const [value, setValue] = useState(() =>
    worldController ? getter(worldController) : defaultValue
  );

  useInterval(() => {
    if (worldController) {
      const newValue = getter(worldController);
      if (compare) {
        if (!compare(value, newValue)) {
          setValue(newValue);
        }
      } else {
        setValue(newValue);
      }
    }
  }, 20);

  return value;
}
