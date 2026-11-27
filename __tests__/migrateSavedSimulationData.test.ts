import fs from "fs";
import path from "path";
import WorldController from "@/simulation/world/WorldController";
import migrateSavedSimulationData, { SAVE_FORMAT_VERSION } from "@/simulation/serialization/migrateSavedSimulationData";
import deserializeSimulationData, { serializeSetup, serializeSimulationData } from "@/simulation/serialization/formatters/simulationDataSerialization";
import { loadSavedWorldAndResumeRun } from "@/simulation/world/loadWorld";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";

/* files of every version load through migrateSavedSimulationData() */

describe("save format migration", () => {
  let worldController: WorldController;
  let current: SavedSimulationData;

  // the current file as version 1 wrote it: no version, plantGenes as a JSON string
  function version1(changes: { worldControllerData?: object, worldGenerationsData?: object, constants?: object } = {}) {
    const { version, ...file } = current;
    return {
      ...file,
      constants: { ...file.constants, ...changes.constants },
      worldGenerationsData: { ...file.worldGenerationsData, plantGenes: JSON.stringify(file.worldGenerationsData.plantGenes), ...changes.worldGenerationsData },
      worldControllerData: { ...file.worldControllerData, ...changes.worldControllerData },
    };
  }

  beforeEach(() => {
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
    worldController = new WorldController(TEST_SIMULATION_DATA);
    worldController.startRun(TEST_SIMULATION_DATA);
    worldController.pause();
    current = serializeSetup(worldController);
  });

  afterEach(() => {
    worldController.pause();
    jest.restoreAllMocks();
  });

  test("saved files have the current version and plantGenes as an array", () => {
    const saved = serializeSimulationData(worldController);
    expect(saved.version).toBe(SAVE_FORMAT_VERSION);
    expect(saved.worldGenerationsData.plantGenes).toEqual(TEST_SIMULATION_DATA.worldGenerationsData.plantGenes);
  });

  test("a file of the current version is not changed", () => {
    expect(migrateSavedSimulationData(current)).toBe(current);
  });

  test("a version 1 file loads like the same file saved now", () => {
    const fromOld = deserializeSimulationData(worldController, version1());
    const fromCurrent = deserializeSimulationData(worldController, current);
    expect(fromOld.worldGenerationsData.plantGenes).toEqual(TEST_SIMULATION_DATA.worldGenerationsData.plantGenes);
    expect(fromOld.worldControllerData).toEqual(fromCurrent.worldControllerData);
    expect(fromOld.constants).toEqual(fromCurrent.constants);
  });

  test("a version 1 file without plantGenes loads with none", () => {
    const old = version1();
    delete (old.worldGenerationsData as { plantGenes?: string }).plantGenes;
    expect(migrateSavedSimulationData(old).worldGenerationsData.plantGenes).toEqual([]);
  });

  test("a file from a newer version of the app is refused", () => {
    expect(() => migrateSavedSimulationData({ ...current, version: SAVE_FORMAT_VERSION + 1 })).toThrow(/newer version/);
  });

  test("JSON that is not a simulation is refused", () => {
    expect(() => migrateSavedSimulationData({ hello: 1 })).toThrow(/not a simulation file/);
    expect(() => migrateSavedSimulationData(null)).toThrow(/not a simulation file/);
  });

  test("drops ATTACK_MULTIPLE_MASS_AT_BIRTH and MASS_COST_PER_EXECUTE_ACTION from version 1 files", () => {
    const data = migrateSavedSimulationData(version1({ worldControllerData: { ATTACK_MULTIPLE_MASS_AT_BIRTH: 3, MASS_COST_PER_EXECUTE_ACTION: 0.01 } })).worldControllerData;
    expect("ATTACK_MULTIPLE_MASS_AT_BIRTH" in data).toBe(false);
    expect("MASS_COST_PER_EXECUTE_ACTION" in data).toBe(false);
    expect(data.ATTACK_MIN_PREY_MASS_FACTOR).toBe(TEST_SIMULATION_DATA.worldControllerData.ATTACK_MIN_PREY_MASS_FACTOR);
  });

  test("version 1 files without ACTION_ATTACK_OFFSET take ACTION_REPRODUCTION_OFFSET", () => {
    const data = migrateSavedSimulationData(version1({ worldControllerData: { ACTION_ATTACK_OFFSET: undefined, ACTION_REPRODUCTION_OFFSET: 0.3 } })).worldControllerData;
    expect(data.ACTION_ATTACK_OFFSET).toBe(0.3);
  });

  test("keeps ACTION_ATTACK_OFFSET when the file has it", () => {
    const data = migrateSavedSimulationData(version1({ worldControllerData: { ACTION_ATTACK_OFFSET: 0.8, ACTION_REPRODUCTION_OFFSET: 0.3 } })).worldControllerData;
    expect(data.ACTION_ATTACK_OFFSET).toBe(0.8);
  });

  test("version 1 files without MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY take MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE", () => {
    const data = migrateSavedSimulationData(version1({ worldControllerData: {
      MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY: undefined, MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE: 0.07,
    } })).worldControllerData;
    expect(data.MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY).toBe(0.07);
  });

  test("drops the constants of the event logger, in files of any version", () => {
    const old = { LOG_LEVEL: 2, LOG_ENABLED: true, LOG_CREATURE_ID: 3, LOG_LOCALE_STRING: "en-US" };
    const fromVersion1 = migrateSavedSimulationData(version1({ constants: old })).constants;
    expect(["LOG_LEVEL", "LOG_ENABLED", "LOG_CREATURE_ID"].some((key) => key in fromVersion1)).toBe(false);
    expect(fromVersion1.LOG_LOCALE_STRING).toBe("en-US");
    const fromVersion2 = migrateSavedSimulationData({ ...version1({ constants: old }), version: 2 }).constants;
    expect("LOG_ENABLED" in fromVersion2).toBe(false);
    expect(fromVersion2.LOG_LOCALE_STRING).toBe("en-US");
  });

  describe("version 2: AttackPlant and AttackAnimal become Attack", () => {
    const actionGene = (sinkId: number) => (1 << 31 | 0 << 24 | 1 << 23 | sinkId << 16 | 12345) | 0;
    const neuronGene = (sinkId: number) => (1 << 31 | 0 << 24 | 0 << 23 | sinkId << 16 | 12345) | 0;
    const actionOf = (gene: number, actions: string[]) => actions[((gene >> 16) & 127) % actions.length];

    function version2(enabledActions: string[], genes: number[]) {
      return {
        ...current,
        version: 2,
        worldGenerationsData: { ...current.worldGenerationsData, enabledActions, plantGenes: genes },
        species: [{ genes, creatures: [] }],
        startGenomes: [{ genes, count: 1 }],
      };
    }

    test("genes keep driving the same action, under its new position", () => {
      const oldActions = ["MoveEast", "Reproduction", "AttackPlant", "AttackAnimal", "MoveToPrey"];
      // raw ids 8 and 9 wrap to AttackAnimal and MoveToPrey
      const genes = [0, 1, 2, 3, 4, 8, 9].map(actionGene).concat(neuronGene(3));
      const migrated = migrateSavedSimulationData(version2(oldActions, genes));
      const newActions = migrated.worldGenerationsData.enabledActions;
      expect(newActions).toEqual(["MoveEast", "Reproduction", "Attack", "MoveToPrey"]);
      for (const migratedGenes of [migrated.species![0].genes, migrated.startGenomes![0].genes, migrated.worldGenerationsData.plantGenes]) {
        expect(migratedGenes.slice(0, 7).map((gene) => actionOf(gene, newActions)))
          .toEqual(genes.slice(0, 7).map((gene) => actionOf(gene, oldActions).replace(/AttackPlant|AttackAnimal/, "Attack")));
        // the weight, the source and the genes that drive neurons do not change
        expect(migratedGenes.map((gene) => gene & 0xFFFF)).toEqual(genes.map((gene) => gene & 0xFFFF));
        expect(migratedGenes[7]).toBe(genes[7]);
      }
    });

    test("with only AttackPlant the genes are not changed", () => {
      const genes = [0, 1, 2, 5].map(actionGene);
      const migrated = migrateSavedSimulationData(version2(["MoveEast", "Reproduction", "AttackPlant"], genes));
      expect(migrated.worldGenerationsData.enabledActions).toEqual(["MoveEast", "Reproduction", "Attack"]);
      expect(migrated.species![0].genes).toEqual(genes);
    });

    test("files with the older Attack action keep their genes and get Attack back", () => {
      const genes = [0, 1, 2, 5].map(actionGene);
      const migrated = migrateSavedSimulationData(version2(["Attack", "MoveEast", "Reproduction"], genes));
      expect(migrated.worldGenerationsData.enabledActions).toEqual(["MoveEast", "Reproduction", "Attack"]);
      expect(migrated.species![0].genes).toEqual(genes);
    });

    test("carnivore settings go: their genus share goes to herbivores and AttackPlant's cost to Attack", () => {
      const file = version2(["Reproduction", "AttackPlant", "AttackAnimal"], []);
      const migrated = migrateSavedSimulationData({
        ...file,
        constants: { ...file.constants, POPULATION_DEFAULT_GENUS: [
          { genus: "plant", probability: 0.5 }, { genus: "attack_plant", probability: 0.3 }, { genus: "attack_animal", probability: 0.2 },
        ] },
        worldControllerData: {
          ...file.worldControllerData,
          MASS_AT_BIRTH_ATTACK_ANIMAL: 6,
          ASSIMILATION_EFFICIENCY: { plant: { photosynthesis: 1 }, attack_plant: { prey: 0.5 }, attack_animal: { prey: 0.2 } },
          ACTION_COSTS: { Reproduction: 0.1, AttackPlant: 0.3, AttackAnimal: 0.4 },
        },
      });
      expect(migrated.version).toBe(SAVE_FORMAT_VERSION);
      expect(migrated.constants.POPULATION_DEFAULT_GENUS).toEqual([
        { genus: "plant", probability: 0.5 }, { genus: "attack_plant", probability: 0.5 },
      ]);
      expect("MASS_AT_BIRTH_ATTACK_ANIMAL" in migrated.worldControllerData).toBe(false);
      expect(migrated.worldControllerData.ASSIMILATION_EFFICIENCY).toEqual({ plant: { photosynthesis: 1 }, attack_plant: { prey: 0.5 } });
      expect(migrated.worldControllerData.ACTION_COSTS).toEqual({ Reproduction: 0.1, Attack: 0.3 });
    });
  });

  describe("version 3 metabolism constants", () => {
    const version3 = (controller: object) => migrateSavedSimulationData({
      ...current, version: 3, worldControllerData: { ...current.worldControllerData, ...controller },
    }).worldControllerData as any;

    test("the unused constants and the prey efficiency of plants go", () => {
      const data = version3({
        MASS_AT_BIRTH_ATTACK: 2, ACTION_REPRODUCTION_OFFSET: 0.6,
        ASSIMILATION_EFFICIENCY: { plant: { photosynthesis: 0.4, prey: 1 }, attack_plant: { photosynthesis: 0, prey: 0.3 } },
      });
      expect("MASS_AT_BIRTH_ATTACK" in data).toBe(false);
      expect("ACTION_REPRODUCTION_OFFSET" in data).toBe(false);
      expect(data.ASSIMILATION_EFFICIENCY).toEqual({ plant: { photosynthesis: 0.4 }, attack_plant: { photosynthesis: 0, prey: 0.3 } });
    });
  });

  test("version 3 move costs add up to MOVE_COST_PER_MASS", () => {
    const { MOVE_COST_PER_MASS, ...controller } = current.worldControllerData;
    const data = migrateSavedSimulationData({
      ...current, version: 3, worldControllerData: { ...controller, MOVE_COST_PER_MASS_TRY: 0.2, MOVE_COST_PER_MASS_DO: 0.6 },
    }).worldControllerData as any;
    expect(data.MOVE_COST_PER_MASS).toBeCloseTo(0.8);
    expect("MOVE_COST_PER_MASS_TRY" in data).toBe(false);
    expect("MOVE_COST_PER_MASS_DO" in data).toBe(false);
  });

  // the scenarios users see first
  const publicDir = path.join(__dirname, "..", "public");
  // see docs/known-issues.md: its creatures carry more mass than the world has water
  const notLoading = ["sim W19 generation 16_herbivores.sim"];
  const samples = fs.readdirSync(publicDir).filter((name) => name.endsWith(".sim") && !notLoading.includes(name));

  test.each(samples)("public/%s loads", (name) => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const target = new WorldController(TEST_SIMULATION_DATA);
    // resumeRun() starts the loop: only the load is tested
    jest.spyOn(target as unknown as { startLoop: () => void }, "startLoop").mockImplementation(() => {});
    const sim = loadSavedWorldAndResumeRun(target, fs.readFileSync(path.join(publicDir, name), "utf8"));
    expect(Array.isArray(sim.worldGenerationsData.plantGenes)).toBe(true);
    target.pause();
  });
});
