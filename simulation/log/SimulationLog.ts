import type WorldController from "../world/WorldController";
import type Creature from "../creature/Creature";
import { Column, creatureColumns, creatureKey, RowContext, SpeciesSnapshot, speciesColumns, speciesSnapshots } from "./logRows";
import { CSV_SEPARATOR, formatValue, headerLine, rowLine } from "./csv";
import setupParams from "./setupParams";
import { CONSTANTS_DEFAULT } from "../constantsDefault";
import { serializeSimulationData } from "../serialization/formatters/simulationDataSerialization";
import type { SavedSimulationData } from "../serialization/data/SavedSimulationData";

/** the version of the format of the files, written in the settings file */
export const LOG_FORMAT_VERSION = 1;

/** The LOG_* constants: saved with the simulation, they apply at once */
export interface LogOptions {
  /** write the file of species */
  LOG_SPECIES: boolean;
  /** write the file of creatures */
  LOG_CREATURES: boolean;
  /** creatures: also the ones that died (once, in the first recording after their death) */
  LOG_INCLUDE_DEAD: boolean;
  /** a recording also writes rows every this many steps; 0 only at the end of each generation */
  LOG_EVERY_N_STEPS: number;
  /** creatures: add the genome of each one */
  LOG_CREATURE_GENOME: boolean;
  /** species: add the keys of the living creatures */
  LOG_SPECIES_CREATURE_LIST: boolean;
  /** locale of the numbers (sets the decimal separator) */
  LOG_LOCALE_STRING: string;
  /** a recording stops when it has this many rows of species and creatures */
  LOG_MAX_ROWS: number;
}

const LOG_OPTION_KEYS: (keyof LogOptions)[] = [
  "LOG_SPECIES", "LOG_CREATURES", "LOG_INCLUDE_DEAD", "LOG_EVERY_N_STEPS", "LOG_CREATURE_GENOME",
  "LOG_SPECIES_CREATURE_LIST", "LOG_LOCALE_STRING", "LOG_MAX_ROWS",
];

/** the defaults, from CONSTANTS_DEFAULT */
export const LOG_OPTIONS_DEFAULT = Object.fromEntries(
  LOG_OPTION_KEYS.map((key) => [key, CONSTANTS_DEFAULT[key]])
) as unknown as LogOptions;

/** all: every species and creature; marked: the ones marked in the Population tab */
export type LogScope = "all" | "marked";

export enum LogState {
  IDLE = "idle",
  RECORDING = "recording",
  /** the recording reached LOG_MAX_ROWS */
  FULL = "full",
  /** the simulation was restarted or loaded during the recording */
  RUN_REPLACED = "run replaced",
}

export interface LogFile {
  kind: "settings" | "species" | "creatures";
  name: string;
  /** the lines of the file */
  lines: string[];
}

interface Recording {
  /** the code of the run when the recording started: it names the files, also after a restart */
  simCode: string;
  /** the simulation as it was when its run was replaced (a restart, a loaded file, an extinction) */
  endSim: SavedSimulationData | null;
  options: LogOptions;
  scope: LogScope;
  settings: string[];
  species: string[] | null;
  creatures: string[] | null;
  speciesColumns: Column<SpeciesSnapshot>[];
  creatureColumns: Column<Creature>[];
  firstGen: number;
  lastGen: number;
  rows: number;
  savedRows: number;
  /** dead creatures already written: the list of the registry, and how many of it */
  deadList: Creature[] | null;
  deadWritten: number;
}

/**
 * The log of the Simulation tab: tables of species and creatures, one row per species or
 * creature and recording, plus a file with the settings. A snapshot writes the current state;
 * a recording adds rows at the end of every generation (and every LOG_EVERY_N_STEPS steps).
 * It only reads the world: it draws no random numbers and changes nothing.
 */
export default class SimulationLog {
  private world: WorldController;
  private recording: Recording | null = null;
  private _state: LogState = LogState.IDLE;
  // a recording asked to start with the next run: created at its first step, when the world is set up
  private startWithNextRun = false;
  private pendingStart = false;
  scope: LogScope = "all";
  /** speciesId of the marked species */
  readonly markedSpecies = new Set<string>();
  /** creatureKey of the marked creatures */
  readonly markedCreatures = new Set<string>();
  /** increases with every change, so the UI can read the sets */
  version = 0;

  constructor(world: WorldController) {
    this.world = world;
  }

  get options(): LogOptions {
    return { ...LOG_OPTIONS_DEFAULT, ...pickLogOptions(this.world.simData.constants) };
  }

  get state(): LogState {
    return this._state;
  }
  get isRecording(): boolean {
    return this._state === LogState.RECORDING;
  }
  get rowCount(): number {
    return this.recording?.rows ?? 0;
  }
  get hasUnsavedRows(): boolean {
    return !!this.recording && this.recording.rows > this.recording.savedRows;
  }
  get firstGeneration(): number {
    return this.recording?.firstGen ?? 0;
  }
  get lastGeneration(): number {
    return this.recording?.lastGen ?? 0;
  }
  get maxRows(): number {
    return this.recording?.options.LOG_MAX_ROWS ?? this.options.LOG_MAX_ROWS;
  }

  // -- marks

  isSpeciesMarked(id: string): boolean {
    return this.markedSpecies.has(id);
  }
  isCreatureMarked(creature: Creature): boolean {
    return this.markedCreatures.has(creatureKey(creature.birthGen, creature.id));
  }
  setSpeciesMarked(id: string, marked: boolean): void {
    if (marked) this.markedSpecies.add(id);
    else this.markedSpecies.delete(id);
    this.changed();
  }
  setCreatureMarked(creature: Creature, marked: boolean): void {
    this.setCreatureKeyMarked(creatureKey(creature.birthGen, creature.id), marked);
  }
  setCreatureKeyMarked(key: string, marked: boolean): void {
    if (marked) this.markedCreatures.add(key);
    else this.markedCreatures.delete(key);
    this.changed();
  }
  clearMarks(): void {
    this.markedSpecies.clear();
    this.markedCreatures.clear();
    this.changed();
  }
  setScope(scope: LogScope): void {
    this.scope = scope;
    this.changed();
  }

  // -- snapshot

  /** the files of the current state, without touching the recording */
  snapshot(): LogFile[] {
    const world = this.world;
    const options = this.options;
    const recording = this.newRecording(options, this.scope);
    this.writeRows(recording, false);
    const step = world.currentStep;
    return this.filesOf(recording, `sim ${world.simCode} log ${world.currentGen} step ${step}`);
  }

  // -- recording

  /** starts a new recording, deleting the rows of the previous one */
  startRecording(): void {
    this.recording = this.newRecording(this.options, this.scope);
    this._state = LogState.RECORDING;
    this.startWithNextRun = this.pendingStart = false;
    this.changed();
  }

  /**
   * The next run (a Restart) starts a new recording from its generation 1. Call it right
   * before the restart: the loop runs steps as soon as the run starts.
   */
  startRecordingWithNextRun(): void {
    this.startWithNextRun = true;
  }

  /**
   * Goes on with a recording stopped by a restart or a loaded file, adding rows to it. Its
   * settings file is the one of the start. False when there is nothing to go on with.
   */
  resumeRecording(): boolean {
    if (!this.recording || this._state !== LogState.RUN_REPLACED) return false;
    this._state = LogState.RECORDING;
    // the dead of the old world are not the ones of the new one
    this.recording.deadList = null;
    // the recording goes on: the simulation saved with it is the one running then
    this.recording.endSim = null;
    this.changed();
    return true;
  }

  stopRecording(): void {
    if (this._state === LogState.RECORDING) this._state = LogState.IDLE;
    this.changed();
  }

  /** deletes the rows of the recording */
  clear(): void {
    this.recording = null;
    this.startWithNextRun = this.pendingStart = false;
    this._state = LogState.IDLE;
    this.changed();
  }

  /** the files of the recording, empty when there is none */
  recordedFiles(): LogFile[] {
    const recording = this.recording;
    if (!recording) return [];
    const range = recording.firstGen === recording.lastGen || recording.lastGen === 0
      ? `${recording.firstGen}`
      : `${recording.firstGen}-${recording.lastGen}`;
    return this.filesOf(recording, `sim ${recording.simCode} log ${range}`);
  }

  /**
   * The simulation to save with the files of the recording: the running one, or, when a restart
   * or a loaded file stopped the recording, the one it recorded as it was then. Null when there
   * is no recording, or when its run was replaced during the pause between generations, when the
   * world is half way and cannot be saved.
   */
  recordedSim(): SavedSimulationData | null {
    const recording = this.recording;
    if (!recording) return null;
    if (this._state === LogState.RUN_REPLACED) return recording.endSim;
    return serializeSimulationData(this.world, false);
  }

  markSaved(): void {
    if (this.recording) this.recording.savedRows = this.recording.rows;
    this.changed();
  }

  /** a recording waits for the first step of the restarted run */
  get isWaitingForRun(): boolean {
    return this.pendingStart;
  }

  /** WorldController: after every step that does not end the generation */
  onStepEnd(): void {
    this.startIfPending();
    const recording = this.recording;
    if (this._state !== LogState.RECORDING || !recording) return;
    const every = recording.options.LOG_EVERY_N_STEPS;
    if (every > 0 && this.world.currentStep % every === 0) this.record(recording);
  }

  /** WorldController: at the end of a generation, while its creatures are still in the world */
  onGenerationEnd(): void {
    this.startIfPending();
    if (this._state === LogState.RECORDING && this.recording) this.record(this.recording);
  }

  /** WorldController: every creature died; the run restarts from generation 1 */
  onExtinction(): void {
    this.startIfPending();
    if (this._state === LogState.RECORDING && this.recording) {
      this.record(this.recording);
      // the restart comes after a pause, during which the world cannot be saved: keep it now
      this.recording.endSim = serializeSimulationData(this.world, false);
    }
  }

  /**
   * WorldController: the run is about to be replaced (a restart, a loaded file), and the world is
   * still the recorded one. Keeps it, to save it with the files. Not during the pause between
   * generations, when the world is half way (after an extinction it was kept by onExtinction)
   */
  beforeRunReplaced(): void {
    if (this._state !== LogState.RECORDING || !this.recording || this.startWithNextRun || this.world.isWaiting) return;
    this.recording.endSim = serializeSimulationData(this.world, false);
  }

  /** WorldController: the run was replaced (restart, a loaded file). The rows are kept */
  onRunReplaced(): void {
    if (this.startWithNextRun) {
      this.startWithNextRun = false;
      this.pendingStart = true;
      this.recording = null;
      this._state = LogState.RECORDING;
      this.changed();
      return;
    }
    if (this._state === LogState.RECORDING) {
      this._state = LogState.RUN_REPLACED;
      this.changed();
    }
  }

  // -- internals

  private startIfPending(): void {
    if (!this.pendingStart) return;
    this.pendingStart = false;
    // the first step has already run: the recording starts at step 1 of the run
    this.recording = this.newRecording(this.options, this.scope);
    this.recording.settings = this.settingsLines(this.options, this.scope, 1);
  }

  private changed(): void {
    this.version++;
  }

  private newRecording(options: LogOptions, scope: LogScope): Recording {
    const world = this.world;
    const recording: Recording = {
      simCode: world.simCode,
      endSim: null,
      options,
      scope,
      settings: this.settingsLines(options, scope),
      species: options.LOG_SPECIES ? [] : null,
      creatures: options.LOG_CREATURES ? [] : null,
      speciesColumns: speciesColumns({ creatureList: options.LOG_SPECIES_CREATURE_LIST }),
      creatureColumns: creatureColumns({ genome: options.LOG_CREATURE_GENOME }),
      firstGen: world.currentGen,
      lastGen: 0,
      rows: 0,
      savedRows: 0,
      deadList: null,
      deadWritten: 0,
    };
    if (recording.species) recording.species.push(headerLine(recording.speciesColumns));
    if (recording.creatures) recording.creatures.push(headerLine(recording.creatureColumns));
    return recording;
  }

  private record(recording: Recording): void {
    this.writeRows(recording, true);
    recording.lastGen = this.world.currentGen;
    if (recording.rows >= recording.options.LOG_MAX_ROWS) this._state = LogState.FULL;
    this.changed();
  }

  // incremental: the dead are written once, in the first recording after their death; otherwise
  // every death of the generation
  private writeRows(recording: Recording, incremental: boolean): void {
    const world = this.world;
    const { options, scope } = recording;
    const context: RowContext = { simCode: world.simCode, generation: world.currentGen, step: world.currentStep };
    const locale = options.LOG_LOCALE_STRING;
    const marked = scope === "marked";
    const room = () => options.LOG_MAX_ROWS - recording.rows;

    if (recording.species) {
      const snapshots = speciesSnapshots(world.generations, marked ? this.markedSpecies : undefined);
      for (const snapshot of snapshots) {
        if (room() <= 0) return;
        recording.species.push(rowLine(recording.speciesColumns, snapshot, context, locale));
        recording.rows++;
      }
    }

    if (recording.creatures) {
      const passes = (creature: Creature) => !marked
        || this.markedSpecies.has(creature.speciesId)
        || this.markedCreatures.has(creatureKey(creature.birthGen, creature.id));
      const write = (creature: Creature) => {
        if (room() <= 0 || !passes(creature)) return;
        recording.creatures!.push(rowLine(recording.creatureColumns, creature, context, locale));
        recording.rows++;
      };
      for (const creature of world.generations.currentCreatures) {
        if (creature.isAlive) write(creature);
      }
      if (options.LOG_INCLUDE_DEAD) {
        const dead = world.generations.speciesRegistry.deadThisGeneration;
        let from = 0;
        if (incremental) {
          // the registry starts a new list every generation
          if (recording.deadList !== dead) {
            recording.deadList = dead;
            recording.deadWritten = 0;
          }
          from = recording.deadWritten;
          recording.deadWritten = dead.length;
        }
        for (let i = from; i < dead.length; i++) write(dead[i]);
      }
    }
  }

  private settingsLines(options: LogOptions, scope: LogScope, startStep?: number): string[] {
    const world = this.world;
    const locale = options.LOG_LOCALE_STRING;
    const line = (kind: string, name: string, value: number | string | boolean) => {
      const isText = typeof value === "string";
      return [kind, name, isText ? "0" : formatValue(value, locale, 10), isText ? formatValue(value, locale) : ""]
        .join(CSV_SEPARATOR) + "\n";
    };
    const lines = [["kind", "name", "value", "text"].join(CSV_SEPARATOR) + "\n"];
    lines.push(line("LOG", "formatVersion", LOG_FORMAT_VERSION));
    lines.push(line("LOG", "startGen", world.currentGen));
    lines.push(line("LOG", "startStep", startStep ?? world.currentStep));
    lines.push(line("LOG", "scope", scope));
    for (const [name, value] of Object.entries(options)) lines.push(line("LOG", name, value));
    for (const param of setupParams(world)) lines.push(line(param.eventType, param.name, param.value));
    return lines;
  }

  private filesOf(recording: Recording, base: string): LogFile[] {
    const files: LogFile[] = [{ kind: "settings", name: `${base} settings.csv`, lines: recording.settings }];
    if (recording.species) files.push({ kind: "species", name: `${base} species.csv`, lines: recording.species });
    if (recording.creatures) files.push({ kind: "creatures", name: `${base} creatures.csv`, lines: recording.creatures });
    return files;
  }
}

/** the name of the .sim saved with some log files: the one of their settings file, ending in .sim */
export function simFileName(files: LogFile[]): string | null {
  const settings = files.find((file) => file.kind === "settings");
  return settings ? settings.name.replace(/ settings\.csv$/, ".sim") : null;
}

/** the LOG_* options in a constants object, without the other constants */
export function pickLogOptions(constants: Record<string, unknown> | undefined): Partial<LogOptions> {
  const result: Record<string, unknown> = {};
  for (const key of LOG_OPTION_KEYS) {
    if (constants && constants[key] !== undefined) result[key] = constants[key];
  }
  return result as Partial<LogOptions>;
}
