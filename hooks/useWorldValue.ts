import { useCallback, useSyncExternalStore } from "react";
import { useAtomValue } from "jotai";
import { worldControllerAtom } from "@/components/simulation/store";
import WorldController from "@/simulation/world/WorldController";
import { WorldEvents } from "@/simulation/events/WorldEvents";

const WORLD_CHANGE_EVENTS = [
  WorldEvents.initializeWorld,
  WorldEvents.startGeneration,
  WorldEvents.endStep,
  WorldEvents.stateChange,
];

// endStep can fire thousands of times per second, so notifications are
// coalesced and React is asked to re-check values at most once per frame
function subscribeToWorld(worldController: WorldController, onChange: () => void) {
  let frame: number | undefined;
  const scheduleChange = () => {
    if (frame === undefined) {
      frame = requestAnimationFrame(() => {
        frame = undefined;
        onChange();
      });
    }
  };

  WORLD_CHANGE_EVENTS.forEach((event) =>
    worldController.events.addEventListener(event, scheduleChange)
  );

  return () => {
    WORLD_CHANGE_EVENTS.forEach((event) =>
      worldController.events.removeEventListener(event, scheduleChange)
    );
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}

/*
Reads a value from the WorldController and re-renders when it changes.
The getter must return a primitive or a reference that stays the same while
the data is unchanged (React compares snapshots with Object.is); for the same
reason defaultValue should not be a new object or array on every render.
*/
export default function useWorldValue<T>(
  getter: (worldController: WorldController) => T,
  defaultValue: T
): T {
  const worldController = useAtomValue(worldControllerAtom);

  const subscribe = useCallback(
    (onChange: () => void) =>
      worldController ? subscribeToWorld(worldController, onChange) : () => {},
    [worldController]
  );

  return useSyncExternalStore(
    subscribe,
    () => (worldController ? getter(worldController) : defaultValue),
    () => defaultValue
  );
}
