import WorldController from "@/simulation/world/WorldController";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";

/* the browser schedules the next tick with a MessageChannel message (Node has setImmediate).
   Here MessageChannel is replaced by one whose messages the test delivers by hand */

let queue: unknown[] = [];
class FakeChannel {
  port1: { onmessage: ((event: { data: unknown }) => void) | null } = { onmessage: null };
  port2 = { postMessage: (data: unknown) => { queue.push(data); } };
  constructor() { channels.push(this); }
}
let channels: FakeChannel[] = [];

const realSetImmediate = global.setImmediate;
// lets the awaits inside the loop finish
const settle = () => new Promise((resolve) => realSetImmediate(resolve));

// delivers the messages posted so far, each one as its own task like the browser does;
// returns how many there were
async function deliver(): Promise<number> {
  const messages = queue;
  queue = [];
  for (const data of messages) {
    channels[0].port1.onmessage?.({ data });
    await settle();
  }
  return messages.length;
}

describe("WorldController tick in the browser (MessageChannel)", () => {
  let simulationData: SimulationData;
  let worldController: WorldController;
  let steps: number;
  const saved = { setImmediate: global.setImmediate, MessageChannel: global.MessageChannel };

  beforeEach(() => {
    queue = [];
    channels = [];
    (globalThis as any).window = globalThis;
    (globalThis as any).setImmediate = undefined;
    (globalThis as any).MessageChannel = FakeChannel;
    jest.spyOn(console, "log").mockImplementation(() => {});

    simulationData = {
      ...startUpScenarioSimulationData,
      worldControllerData: {
        ...startUpScenarioSimulationData.worldControllerData,
        size: 20, stepsPerGen: 100000, pauseBetweenSteps: 0, immediateSteps: 1, pauseBetweenGenerations: 0,
      },
      worldGenerationsData: { ...startUpScenarioSimulationData.worldGenerationsData, initialPopulation: 10 },
    };
    worldController = new WorldController(simulationData);
    steps = 0;
    worldController.events.addEventListener(WorldEvents.endStep, () => steps++);
  });

  afterEach(() => {
    worldController.pause();
    global.setImmediate = saved.setImmediate;
    global.MessageChannel = saved.MessageChannel;
    jest.restoreAllMocks();
  });

  test("runs one tick per message", async () => {
    worldController.startRun(simulationData);
    await settle();
    expect(steps).toBe(1);
    expect(queue.length).toBe(1);
    for (let i = 0; i < 5; i++) expect(await deliver()).toBe(1);
    expect(steps).toBe(6);
  });

  test("pause ignores the message in flight and resume continues with a single loop", async () => {
    worldController.startRun(simulationData);
    await settle();
    worldController.pause();
    await deliver();
    expect(steps).toBe(1);
    expect(queue.length).toBe(0);

    worldController.resume();
    await settle();
    expect(steps).toBe(2);
    // a single loop keeps a single message in flight
    for (let i = 0; i < 5; i++) expect(await deliver()).toBe(1);
    expect(steps).toBe(7);
  });

  test("pause and resume before the message arrives do not start a second loop", async () => {
    worldController.startRun(simulationData);
    await settle();
    worldController.pause();
    worldController.resume();
    await settle();
    // the old message and the one of the resumed loop
    expect(queue.length).toBe(2);
    await deliver();
    for (let i = 0; i < 5; i++) expect(await deliver()).toBe(1);
  });

  test("a restart with a message in flight does not start a second loop", async () => {
    worldController.startRun(simulationData);
    await settle();
    worldController.startRun(simulationData);
    await settle();
    expect(queue.length).toBe(2);
    await deliver();
    for (let i = 0; i < 5; i++) expect(await deliver()).toBe(1);
  });
});
