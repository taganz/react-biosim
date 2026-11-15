import { subscribeToWorld } from "@/hooks/useWorldValue";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import type WorldController from "@/simulation/world/WorldController";

/* every useWorldValue shares one subscription per WorldController, notified once per frame */

// the hook itself is not used: only its subscription
jest.mock("jotai", () => ({ useAtomValue: () => undefined }));
jest.mock("@/components/simulation/store", () => ({ worldControllerAtom: {} }));

describe("useWorldValue shared subscription", () => {
  let frames: (() => void)[];
  let events: EventTarget;
  let worldController: WorldController;
  let added: number;

  beforeEach(() => {
    frames = [];
    (globalThis as any).requestAnimationFrame = (callback: () => void) => frames.push(callback);
    (globalThis as any).cancelAnimationFrame = (id: number) => { frames[id - 1] = () => {}; };
    events = new EventTarget();
    added = 0;
    const addEventListener = events.addEventListener.bind(events);
    events.addEventListener = (...args: Parameters<EventTarget["addEventListener"]>) => { added++; addEventListener(...args); };
    worldController = { events } as unknown as WorldController;
  });

  const runFrames = () => { const pending = frames; frames = []; pending.forEach((frame) => frame()); };
  const fire = (event: string) => events.dispatchEvent(new Event(event));

  test("components share the listeners and are notified once per frame", () => {
    const calls = [0, 0, 0];
    const unsubscribe = calls.map((_, i) => subscribeToWorld(worldController, () => calls[i]++));
    expect(added).toBe(4);   // one per event, not per component

    for (let i = 0; i < 100; i++) fire(WorldEvents.endStep);
    fire(WorldEvents.stateChange);
    expect(frames.length).toBe(1);
    runFrames();
    expect(calls).toEqual([1, 1, 1]);

    unsubscribe[0]();
    fire(WorldEvents.endStep);
    runFrames();
    expect(calls).toEqual([1, 2, 2]);

    unsubscribe[1]();
    unsubscribe[2]();
    fire(WorldEvents.endStep);
    expect(frames.length).toBe(0);

    // a new subscriber registers the listeners again
    subscribeToWorld(worldController, () => calls[0]++);
    expect(added).toBe(8);
    fire(WorldEvents.endStep);
    runFrames();
    expect(calls).toEqual([2, 2, 2]);
  });

  test("a listener may unsubscribe another one during the notification", () => {
    let second = 0;
    let unsubscribeSecond = () => {};
    subscribeToWorld(worldController, () => unsubscribeSecond());
    unsubscribeSecond = subscribeToWorld(worldController, () => second++);
    fire(WorldEvents.endStep);
    expect(() => runFrames()).not.toThrow();
    fire(WorldEvents.endStep);
    runFrames();
    expect(second).toBe(1);
  });
});
