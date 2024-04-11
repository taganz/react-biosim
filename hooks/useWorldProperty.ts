import { useCallback, useState } from "react";
import { worldControllerAtom } from "@/components/simulation/store";
import WorldController from "@/simulation/world/WorldController";
import { useAtomValue } from "jotai";
import { useInterval } from "react-use";

export default function useWorldProperty<T>(
  getter: (worldController: WorldController) => T,
  setter: (worldController: WorldController, value: T) => void,
  defaultValue: T,
  compare?: (a: T, b: T) => boolean
): [T, (value: T) => void] {
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

  const set = useCallback(
    (value: T) => {
      if (worldController) {
        setter(worldController, value);
        setValue(value);
      }
    },
    [setter, worldController]
  );

  return [value, set];
}
