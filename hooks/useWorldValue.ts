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

type WorldSubscription = {
  listeners: Set<() => void>;
  frame: number | undefined;
  scheduleChange: () => void;
};

// One subscription per WorldController, shared by every useWorldValue: dozens of components
// read engine values, and each registering its own listeners made every endStep call them all.
// endStep can fire thousands of times per second, so notifications are coalesced and
// React is asked to re-check values at most once per frame
const subscriptions = new WeakMap<WorldController, WorldSubscription>();

export function subscribeToWorld(worldController: WorldController, onChange: () => void) {
  let subscription = subscriptions.get(worldController);
  if (!subscription) {
    const created: WorldSubscription = {
      listeners: new Set(),
      frame: undefined,
      scheduleChange: () => {
        if (created.frame === undefined) {
          created.frame = requestAnimationFrame(() => {
            created.frame = undefined;
            // a copy: a re-render can unsubscribe or subscribe components
            for (const listener of Array.from(created.listeners)) listener();
          });
        }
      },
    };
    WORLD_CHANGE_EVENTS.forEach((event) =>
      worldController.events.addEventListener(event, created.scheduleChange)
    );
    subscriptions.set(worldController, created);
    subscription = created;
  }
  const shared = subscription;
  shared.listeners.add(onChange);

  return () => {
    shared.listeners.delete(onChange);
    if (shared.listeners.size > 0) return;
    WORLD_CHANGE_EVENTS.forEach((event) =>
      worldController.events.removeEventListener(event, shared.scheduleChange)
    );
    if (shared.frame !== undefined) cancelAnimationFrame(shared.frame);
    subscriptions.delete(worldController);
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
