import { worldControllerAtom } from "@/components/simulation/store";
import WorldController from "@/simulation/world/WorldController";
import { PrimitiveAtom, useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import useWorldPropertyValue from "./useWorldPropertyValue";

export default function useSyncAtomWithWorldProperty<T>(
  atom: PrimitiveAtom<T>,
  getter: (worldController: WorldController) => T,
  compare?: (a: T, b: T) => boolean
) {
  const worldController = useAtomValue(worldControllerAtom);
  const [atomValue, setAtomValue] = useAtom(atom);
  const value = useWorldPropertyValue(getter, atomValue, compare);

  useEffect(() => {
    if (worldController) setAtomValue(value);
  }, [worldController, value, setAtomValue]);
}
