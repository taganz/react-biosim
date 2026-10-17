import WorldController from '../world/WorldController';
import {AllowedLogEvents, LogEvent, LogLevel} from "@/simulation/logger/LogEvent"
import setupParams from "@/simulation/logger/setupParams";

export interface SimulationCallEvent {
  logLevel: LogLevel;
  creatureId: number | string;
  speciesId: string;
  genusId: string;
  eventType: LogEvent;
  paramName: string;
  paramValue: number;
  paramValue2: number;
  paramString: string;
}

// LOG_CREATURE_ID that writes no creature rows: only the totals, which count every creature
export const LOG_NO_CREATURES = -1;

// the LOG_* constants that can be changed while the simulation runs
export interface LogOptions {
  LOG_ENABLED: boolean;
  LOG_CREATURE_ID: number;
  LOG_STEP_TOTALS: boolean;
  LOG_EVENTLOGGER_MAX_EVENTS: number;
  LOG_LOCALE_STRING: string;
  LOG_ALLOWED_EVENTS: AllowedLogEvents;
}

/** What the logger is doing, for the UI */
export enum LoggerState {
  OFF = "off",
  PAUSED = "paused",
  // a recording was asked for, it starts at step 1 of a generation
  WAITING = "waiting",
  RECORDING = "recording",
  MAX_REACHED = "max reached",
  // the generations asked for are recorded
  FINISHED = "finished",
}

interface SimulationEvent {
  logLevel: string;
  stepIndex: string;
  currentGen: string;
  currentStep: string;
  speciesId: string;
  genusId: string;
  creatureId: string;
  eventType: string;
  paramName: string;
  paramValue: string;
  paramValue2: string;
  paramString: string;
}


export default class EventLogger {
  _csvHeaders = 'LogLevel;StepIndex;CurrentGen;CurrentStep;SpeciesId;GenusId;CreatureId;EventType;ParamName;ParamValue;ParamValue2;ParamString\n';
  private worldController : WorldController;
  private logThreshold: number;
  private log: SimulationEvent[] = [];
  // SETUP rows in the log: they do not count for the maximum
  private setupRowCount = 0;
  private stepTotals : [LogEvent, string][]=[];
  private genTotals : [LogEvent, string][]=[];
  private paused = true; 
  // why the logger paused by itself
  private stopReason: LoggerState.MAX_REACHED | LoggerState.FINISHED | null = null;
  // rows of the log (with the SETUP rows) when it was last saved
  private savedRowCount = 0;
  private logCreatureId : number;
  // when the single creature being logged died (0 if it has not died)
  private logCreatureDeathGen = 0;
  private logCreatureDeathStep = 0;
  private waitingForFirstGenerationRecording = false;
  
  
  private firstGenerationToRecord = 0;
  private recording = false;
  private generationsToRecord = 1;

  private stepIndex = 0;   
  private firstGenLogged = 0;
  private lastGenLogged  = 0;
  private lastStepLogged = 0;
   

  constructor(worldController : WorldController, logThreshold?: number) {
    this.worldController = worldController;
    this.logCreatureId = this.worldController.simData.constants.LOG_CREATURE_ID;
    if (logThreshold) {
      this.logThreshold = logThreshold;
    } else {
      this.logThreshold =  this.worldController.simData.constants.LOG_EVENTLOGGER_MAX_EVENTS;
    }
    this.reset();
  }


  get isPaused() : boolean {
    return this.paused == true;
  }
  /** rows in the log, without the SETUP rows */
  get logCount() : number {
    return this.log.length - this.setupRowCount;
  }
  get thresholdReached(): boolean {
    return  this.logCount >= this.logThreshold;
  }
  get creatureId() : number {
    return this.logCreatureId;
  }
  get creatureDeathGen() : number {
    return this.logCreatureDeathGen;
  }
  get creatureDeathStep() : number {
    return this.logCreatureDeathStep;
  }
  get maxEvents() : number {
    return this.logThreshold;
  }
  get state() : LoggerState {
    if (!this.worldController.simData.constants.LOG_ENABLED) return LoggerState.OFF;
    if (this.paused) return this.stopReason ?? LoggerState.PAUSED;
    return this.recording ? LoggerState.RECORDING : LoggerState.WAITING;
  }
  /** the generation the recording waits for: 1 waits for a restart */
  get firstGenerationToWaitFor() : number {
    return this.firstGenerationToRecord;
  }
  /** the first and the last generation in the log (0 when it is empty) */
  get firstGenerationLogged() : number {
    return this.firstGenLogged;
  }
  get lastGenerationLogged() : number {
    return this.lastGenLogged;
  }
  /** the recording stops at the end of the generation it is recording */
  get stopsAtEndOfGeneration() : boolean {
    return this.recording && this.generationsToRecord == 0;
  }
  /** the log has events that have not been saved */
  get hasUnsavedRows() : boolean {
    return this.logCount > 0 && this.log.length > this.savedRowCount;
  }
  public markSaved() {
    this.savedRowCount = this.log.length;
  }

  public setMaxEvents(maxEvents: number) {
    this.logThreshold = maxEvents;
  }

  // reset should not reset log because we want to keep previous log if first generation had problems
  public reset() {
    if (!this.waitingForFirstGenerationRecording) {
      this.pause();
    }
    this.waitingForFirstGenerationRecording = false;
   }
 

  public pause() {
    this.paused = true;
    this.stopReason = null;
  }

  // start recording from next generation continuous; false if the log is full
  public resume() : boolean {
    if (this.thresholdReached) {
      console.warn("EventLogger, can't resume max logCount attained: ", this.logThreshold);
      return false;
    } 
    else {
      this.paused = false;
      this.stopReason = null;
      this.firstGenerationToRecord = this.worldController.currentGen + 1;
      this.recording = false;
      this.generationsToRecord = 999999999;
      return true;
    }
  }

  public deleteLog() {
    this.stepIndex = 0;
    this.lastStepLogged = 0;
    this.firstGenLogged = 0;
    this.lastGenLogged = 0;
    this.log = [];
    this.setupRowCount = 0;
    this.savedRowCount = 0;
    this.stepTotals = [];
    this.genTotals =[];
  }

  /** remembers when the single creature being logged dies, also while the logger is paused */
  public noteCreatureDeath(id: number) {
    if (this.logCreatureId <= 0 || id != this.logCreatureId) return;
    this.logCreatureDeathGen = this.worldController.currentGen;
    this.logCreatureDeathStep = this.worldController.currentStep;
  }

  /**
   * Deletes the log and records from step 1 of generation 1 (after a restart) or of the next
   * generation, for one generation or until the logger is stopped.
   */
  public startRecording(fromFirstGeneration: boolean, oneGeneration: boolean) {
    this.deleteLog();
    this.paused = false;
    this.stopReason = null;
    this.firstGenerationToRecord = fromFirstGeneration ? 1 : this.worldController.currentGen + 1;
    this.recording = false;
    this.generationsToRecord = oneGeneration ? 1 : 999999999;
    this.waitingForFirstGenerationRecording = fromFirstGeneration;
  }

  // record 1 generation
  public recordNextGeneration() {
    this.startRecording(false, true);
  }
  public recordFirstGeneration() {
    this.startRecording(true, true);
  }
  public recordFromFirstGeneration() {
    this.startRecording(true, false);
  }
  
  public logEvent(eventValues: SimulationCallEvent) : void {

    if (this.thresholdReached) {
      if (!this.paused) this.stopReason = LoggerState.MAX_REACHED;
      this.paused = true;
      return;
    }
    if (this.isPaused) return;
    if (!this.worldController.simData.constants.LOG_ENABLED) return ;
    if (!this.worldController.simData.constants.LOG_ALLOWED_EVENTS[eventValues.eventType]) return;    
    if (this.recording == false && this.generationsToRecord > 0) {
      if ((this.firstGenerationToRecord >= this.worldController.currentGen)
              && (this.worldController.currentStep == 1)) {
          this.recording = true;
          // Creature to log is read when a recording starts
          this.logCreatureId = this.worldController.simData.constants.LOG_CREATURE_ID;
          this.logCreatureDeathGen = 0;
          this.logCreatureDeathStep = 0;
          if (this.firstGenLogged == 0) this.firstGenLogged = this.worldController.currentGen;
          this.lastStepLogged = this.worldController.currentStep;
          this.lastGenLogged = this.worldController.currentGen;
          this.stepIndex = 1;
          this.generationsToRecord--;
          this.waitingForFirstGenerationRecording = false;
          this.logSetupRows();
        }
        else {
          return;
        }

      }
      // detect restart
      if (this.lastGenLogged > this.worldController.currentGen 
        || (this.lastGenLogged == this.worldController.currentGen 
            && this.lastStepLogged > this.worldController.currentStep)
      ) {
        console.error("EventLogger. Looks as if a reset() should had occurred");
        this.recording = false;
        this.generationsToRecord = 0;
        this.pause();
        return;
    }
    
    
    // check step and gen changes and insert aggregated before loggin new step

    if (this.lastStepLogged < this.worldController.currentStep
        || this.lastGenLogged < this.worldController.currentGen) {
        this.aggregateAtStepLevel(eventValues);
        if (this.lastGenLogged != this.worldController.currentGen) {
            this.aggregateAtGenerationLevel(eventValues);
            if (this.generationsToRecord == 0) {
              this.pause();
              this.stopReason = LoggerState.FINISHED;
              return;
            }
          };
        this.stepIndex++;
    }

    this.logReceivedEvent(eventValues);

    this.lastGenLogged = this.worldController.currentGen;
    this.lastStepLogged = this.worldController.currentStep;
  

  }

  /**
   * Writes the configuration of the simulation (SETUP rows) if the logger is recording.
   * The controller calls it every time a run is set up; a recording also writes it when it starts.
   */
  public logSetup(): void {
    if (this.recording && !this.isPaused && this.worldController.simData.constants.LOG_ENABLED) {
      this.logSetupRows();
    }
  }

  // SETUP rows skip the level, the event filter and the maximum: a log always says how it was made
  private logSetupRows() {
    const locale = this.worldController.simData.constants.LOG_LOCALE_STRING;
    for (const { eventType, name, value } of setupParams(this.worldController)) {
      this.pushEventToLog({
        logLevel: LogLevel.SETUP,
        stepIndex: this.stepIndex.toString(),
        currentGen: this.worldController.currentGen.toString(),
        currentStep: this.worldController.currentStep.toString(),
        speciesId: "",
        genusId: "",
        creatureId: "",
        eventType,
        paramName: name,
        // constants can be small (0.0001), so more decimals than the other rows
        paramValue: typeof value === "number" ? value.toLocaleString(locale, {maximumFractionDigits: 10}) : "0",
        paramValue2: "0",
        paramString: typeof value === "number" ? "" : value,
      });
      this.setupRowCount++;
    }
  }

  // creature rows unless the recording logs no creatures, step totals if LOG_STEP_TOTALS is on, the rest always
  private levelIsRecorded(level: LogLevel): boolean {
    switch (level) {
      case LogLevel.CREATURE:
        return this.logCreatureId != LOG_NO_CREATURES;
      case LogLevel.STEP:
        return this.worldController.simData.constants.LOG_STEP_TOTALS === true;
      default:
        return true;
    }
  }

  private logReceivedEvent(eventValues:SimulationCallEvent) {

      // if logging creature log, check id range
      if (eventValues.logLevel == LogLevel.CREATURE) {
        if (!(this.logCreatureId == 0 
          || this.logCreatureId == LOG_NO_CREATURES
          || this.logCreatureId == eventValues.creatureId 
          || (this.logCreatureId == -10 && <number>eventValues.creatureId > 0 && <number>eventValues.creatureId < 10)
          || (this.logCreatureId == -30 && <number>eventValues.creatureId > 0 && <number>eventValues.creatureId < 30)
          )) {
        return;
        }
        // counted for the step and generation totals even when creature rows are not recorded;
        // BIRTH genome is not: there is already BIRTH parentId, once per birth
        if (!(eventValues.eventType == LogEvent.BIRTH && eventValues.paramName == "genome")) {
          this.stepTotals.push([eventValues.eventType, eventValues.paramName])
          this.genTotals.push([eventValues.eventType, eventValues.paramName])
        }
      }

      if (!this.levelIsRecorded(eventValues.logLevel)) return;

    const simulationEvent : SimulationEvent = {
      logLevel : eventValues.logLevel,
      stepIndex : this.stepIndex.toString(),
      currentGen : this.worldController.currentGen.toString(),
      currentStep : this.worldController.currentStep.toString(),
      speciesId : eventValues.speciesId,
      genusId : eventValues.genusId,
      creatureId : eventValues.creatureId.toString(),
      eventType : eventValues.eventType,
      paramName : eventValues.paramName,
      paramValue : eventValues.paramValue.toLocaleString(this.worldController.simData.constants.LOG_LOCALE_STRING, {maximumFractionDigits : 2}),
      paramValue2 : eventValues.paramValue2.toLocaleString(this.worldController.simData.constants.LOG_LOCALE_STRING, {maximumFractionDigits : 2}),
      paramString : eventValues.paramString
    }

    this.pushEventToLog(simulationEvent);
  }
  
  // get events data in blob format to write to file; one part per line, so the file is never one big string
  public getLogBlob(): Blob {
    return new Blob(this.csvLines(), { type: 'text/plain;charset=utf-8' });
  }

  public getLog(): string {
    return this.csvLines().join("");
  }

  // the header, then one line per row, each one ending in \n
  private csvLines(): string[] {
    const lines = [this._csvHeaders];
    for (const event of this.log) {
      lines.push(`${event.logLevel};${event.stepIndex};${event.currentGen};${event.currentStep};`
                  +`${event.speciesId};${event.genusId};${event.creatureId};${event.eventType};`
                  +`${event.paramName};${event.paramValue};${event.paramValue2};${event.paramString}\n`);
    }
    return lines;
  }
  
  private pushEventToLog(simulationEvent : SimulationEvent) {
    this.log.push(simulationEvent);
  }

  private aggregateAtStepLevel(eventValues:SimulationCallEvent) {
      if (!this.levelIsRecorded(LogLevel.STEP)) {
        this.stepTotals = [];
        return;
      }

      // sum paramValue # 1 
      const aggregatedAtStepLevel = this.countEvents(this.stepTotals.map(item => [item[0], item[1]]));
      aggregatedAtStepLevel.map(item => {
          const aggregatedEvent : SimulationEvent = {
            logLevel : LogLevel.STEP,
            stepIndex : this.stepIndex.toString(),
            currentGen : this.lastGenLogged.toString(),
            currentStep : this.lastStepLogged.toString(),
            speciesId : "",
            genusId : "",
            creatureId : "",
            eventType : item[0],
            paramName : item[1].concat(" sum"),
            paramValue : item[2].toString(),
            paramValue2 : "",
            paramString : "",
          }
          this.pushEventToLog(aggregatedEvent);
       });
      this.stepTotals = [];
  }

  private aggregateAtGenerationLevel(eventValues:SimulationCallEvent) {
    if (!this.levelIsRecorded(LogLevel.GENERATION)) {
      this.genTotals = [];
      return;
    }

    const aggregatedAtGenerationLevel = this.countEvents(this.genTotals.map(item => [item[0], item[1]]));
    aggregatedAtGenerationLevel.map(item => {
        const aggregatedEvent : SimulationEvent = {
          logLevel : LogLevel.GENERATION,
          stepIndex : this.stepIndex.toString(),
          currentGen : this.lastGenLogged.toString(),
          currentStep : "",
          speciesId : "",
          genusId : "",
          creatureId : "",
          eventType : item[0],
          paramName : item[1].concat(" sum"),
          paramValue : item[2].toString(),
          paramValue2 : "",
          paramString : "",
        }
        this.pushEventToLog(aggregatedEvent);
      });
    this.genTotals = [];
  }

  private countEvents(array1: [LogEvent, string][]) : [LogEvent, string, number][] {
    
    // Define types for pairs and count
    type Pair = [LogEvent, string];
    type PairWithCount = [LogEvent, string, number];

    // the map keeps the pair itself: event names and param names can contain any separator
    const pairCounts = new Map<string, PairWithCount>();

    array1.forEach(([event, str]: Pair) => {
        const key = JSON.stringify([event, str]);
        const counted = pairCounts.get(key);
        if (counted) {
          counted[2]++;
        } else {
          pairCounts.set(key, [event, str, 1]);
        }
    });

    return [...pairCounts.values()];
  }


}
