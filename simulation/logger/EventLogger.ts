import WorldController from '../world/WorldController';
import {LogEvent, LogLevel} from "@/simulation/logger/LogEvent"

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
  private readonly logThreshold: number;
  // should be reset at reset()
  private log: SimulationEvent[] = [];
  private stepTotals : [LogEvent, string][]=[];
  private generationTotals : [LogEvent, string][]=[];
  private lastStepTotals : number = 1;
  private lastGenerationTotals : number = 1;
  private generationTotalsHaveSeenStepZero : boolean = false;
  private paused = true; 
  private logCreatureId : number;
  private currentLogLevel : LogLevel;
  private singleGenerationRecording = false;
  private fromFirstGenerationRecording = false;
  private firstGenerationRecording = false;
  private firstGenerationRecordingStarted = false;
  private generationToRecord = 0;
  private stepIndex = 1;   
  private lastStepLogged = 1;
  

 // constructor(logFilePath: string, logThreshold: number = 10) {
  constructor(worldController : WorldController, logThreshold?: number) {
    this.worldController = worldController;
    this.logCreatureId = this.worldController.simData.constants.LOG_CREATURE_ID;
    this.currentLogLevel = this.worldController.simData.constants.LOG_LEVEL;
    if (logThreshold) {
      this.logThreshold = logThreshold;
    } else {
      this.logThreshold =  this.worldController.simData.constants.LOG_EVENTLOGGER_MAX_EVENTS;
    }
    this.reset();
    //console.log("eventLogger initialized");
  }


  get isPaused() : boolean {
    return this.paused == true;
  }
  get isWaitingForRestart() : boolean {
    return this.firstGenerationRecording && !this.firstGenerationRecordingStarted;
  }
  get logCount() : number {
    return this.log.length;
  }
  get thresholdReached(): boolean {
    return  this.log.length >= this.logThreshold;
  }
  get creatureId() : number {
    return this.logCreatureId;
  }

  public reset() {
    // if (this.worldController.simData.constants.RESET_AT_RESTART) {
    //   deleteLog()
    // }
    this.stepIndex = 1;
    this.lastStepLogged = 1;
    this.lastStepTotals = 1;
    this.lastGenerationTotals = 1;
    if (!this.firstGenerationRecording && !this.fromFirstGenerationRecording) {
      this.pause();
    }
 
   }
 

  public pause() {
    this.paused = true;
    this.generationTotalsHaveSeenStepZero = false;
  }

  //public start() {
  //  this.reset();
  //  this.paused = false;
  //}
  public resume() {
    if (this.logCount > this.logThreshold) {
      console.warn("EventLogger, can't resume max logCount attained: ", this.logThreshold);
    } 
    else {
      this.paused = false;
    }
  }

  public deleteLog() {
    this.log = [];
    this.stepTotals = [];
    this.generationTotals =[];
    this.lastStepTotals = 0;
    this.lastGenerationTotals = 0;
    this.generationTotalsHaveSeenStepZero = false;
  }

  public startLoggingCreatureId(id: number) {
    this.paused = false;
    this.currentLogLevel = LogLevel.CREATURE;
    this.logCreatureId = id;
    this.worldController.generations.creatureById(this.logCreatureId).logBasicData();  
  }

  public recordNextGeneration() {
    this.singleGenerationRecording = true;
    this.generationToRecord = this.worldController.currentGen + 1;
    this.firstGenerationRecording = false;
    this.fromFirstGenerationRecording = false;
    this.deleteLog();
    this.resume();
  }
  private recordNextGenerationFinished() {
    this.singleGenerationRecording = false;
    this.pause();
  }
  public recordFirstGeneration() {
    this.firstGenerationRecording = true;
    this.firstGenerationRecordingStarted = false;
    this.singleGenerationRecording = false;
    this.fromFirstGenerationRecording = false;
    this.deleteLog();
    this.resume();
  }
  private recordFirstGenerationFinished() {
    this.firstGenerationRecording = false;
    this.firstGenerationRecordingStarted = false;
    this.pause();
  }
  public recordFromFirstGeneration() {
    this.fromFirstGenerationRecording = true;
    this.firstGenerationRecording = false;
    this.firstGenerationRecordingStarted = false;
    this.singleGenerationRecording = false;
    this.deleteLog();
    this.resume();
  }
  
  public logEvent(eventValues: SimulationCallEvent) : void {

    if (this.logCount >= this.logThreshold) {
      this.paused = true;
      return;
    }
    if (this.isPaused) return;
    if (!this.worldController.simData.constants.LOG_ENABLED) return ;
    if (!this.worldController.simData.constants.LOG_ALLOWED_EVENTS[eventValues.eventType]) return;
    // checks for single generation recording
    if (this.singleGenerationRecording && this.worldController.currentGen < this.generationToRecord) {
      return;
    }
    if (this.singleGenerationRecording && this.worldController.currentGen > this.generationToRecord) {
      this.recordNextGenerationFinished();
      return;
    }
    
    // checks for first generation recording
    if (this.firstGenerationRecording && !this.firstGenerationRecordingStarted 
          && (this.worldController.currentGen > 1 
          || (this.worldController.currentGen == 1 && this.worldController.currentStep > 1))) {
      // not restarted yet
      return;
    }
    if (this.firstGenerationRecording && !this.firstGenerationRecordingStarted 
          && this.worldController.currentGen == 1 && this.worldController.currentStep == 1) {
      // started
      this.firstGenerationRecordingStarted = true;
    }
    if (this.firstGenerationRecording && this.firstGenerationRecordingStarted && this.worldController.currentGen > 1) {
      this.recordFirstGenerationFinished();
      return;
    }
    
    // checks for from first generation recording
    if (this.fromFirstGenerationRecording && !this.firstGenerationRecordingStarted 
      && (this.worldController.currentGen > 1 || (this.worldController.currentGen == 1 && this.worldController.currentStep > 1))) {
      // not restarted yet
      return;
    }
    if (this.fromFirstGenerationRecording && !this.firstGenerationRecordingStarted && this.worldController.currentGen == 1 && this.worldController.currentStep == 1) {
      // started
      this.firstGenerationRecordingStarted = true;
    }

    
    this.logReceivedEvent(eventValues);
    
    if (eventValues.logLevel == LogLevel.CREATURE) {
      this.aggregateAtStepLevel(eventValues);
      this.aggregateAtGenerationLevel(eventValues);
    }

   
  }

 

  // get events data in blog format to write to file 
  public getLogBlob(): Blob {
    let csvData: string;

    csvData = this.getLog();

    const blob = new Blob([csvData], { type: 'text/plain;charset=utf-8' });
    return blob;
    
  }

  public getLog(): string {
    let csvData: string;

    csvData = this._csvHeaders;

    // _csvHeaders should also be initialized!!
    for (const event of this.log) {
      csvData += `${event.logLevel};${event.stepIndex};${event.currentGen};${event.currentStep};`
                  +`${event.speciesId};${event.genusId};${event.creatureId};${event.eventType};`
                  +`${event.paramName};${event.paramValue};${event.paramValue2};${event.paramString}\n`;
    }

    return csvData;
    
  }
  
  private logReceivedEvent(eventValues:SimulationCallEvent) {
    
      if ((eventValues.logLevel == LogLevel.CREATURE) && (this.currentLogLevel == LogLevel.STEP)) return ;
      if ((eventValues.logLevel == LogLevel.CREATURE) && (this.currentLogLevel == LogLevel.GENERATION)) return;
      if ((eventValues.logLevel == LogLevel.CREATURE) && (this.currentLogLevel == LogLevel.WORLD)) return ;
      if ((eventValues.logLevel == LogLevel.STEP) && (this.currentLogLevel == LogLevel.GENERATION)) return;
      if ((eventValues.logLevel == LogLevel.STEP) && (this.currentLogLevel == LogLevel.WORLD)) return ;
      if ((eventValues.logLevel == LogLevel.GENERATION) && (this.currentLogLevel == LogLevel.WORLD)) return;
  
      // if logging creature log, check id range
      if (eventValues.logLevel == LogLevel.CREATURE) {
        if (!(this.logCreatureId == 0 
          || this.logCreatureId == eventValues.creatureId 
          || (this.logCreatureId == -10 && <number>eventValues.creatureId > 0 && <number>eventValues.creatureId < 10)
          || (this.logCreatureId == -30 && <number>eventValues.creatureId > 0 && <number>eventValues.creatureId < 30)
          )) {
        return;
        }
      }
  
 
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

  private pushEventToLog(simulationEvent : SimulationEvent) {
    this.log.push(simulationEvent);
    if (this.lastStepLogged != this.worldController.currentStep) {
      this.stepIndex++;
      this.lastStepLogged = this.worldController.currentStep;
    }
  }

  private aggregateAtStepLevel(eventValues:SimulationCallEvent) {
    //TODO don't start recording until step start

    if (this.worldController.currentStep != this.lastStepTotals) {
        const aggregatedAtStepLevel = this.countEvents(this.stepTotals.map(item => [item[0], item[1]]));
        aggregatedAtStepLevel.map(item => {
            const aggregatedEvent : SimulationEvent = {
              logLevel : LogLevel.STEP,
              stepIndex : this.stepIndex.toString(),
              currentGen : this.lastGenerationTotals.toString(),
              currentStep : this.lastStepTotals.toString(),
              speciesId : "",
              genusId : "",
              creatureId : "",
              eventType : item[0],
              paramName : item[1].concat(" count"),
              paramValue : item[2].toString(),
              paramValue2 : "",
              paramString : "",
            }

            this.pushEventToLog(aggregatedEvent);
          });
      this.stepTotals = [];
      this.lastStepTotals = this.worldController.currentStep;
     }
    this.stepTotals.push([eventValues.eventType, eventValues.paramName]);
  }

  private aggregateAtGenerationLevel(eventValues:SimulationCallEvent) {
    // don't start recording a generation until step 1
    if (this.worldController.currentStep == 1) {
      this.generationTotalsHaveSeenStepZero = true;
    } 
    if (!this.generationTotalsHaveSeenStepZero) {
      return;
    }

    if (this.worldController.currentGen != this.lastGenerationTotals) {
      const aggregatedAtGenerationLevel = this.countEvents(this.generationTotals.map(item => [item[0], item[1]]));
      aggregatedAtGenerationLevel.map(item => {
          const aggregatedEvent : SimulationEvent = {
            logLevel : LogLevel.GENERATION,
            stepIndex : this.stepIndex.toString(),
            currentGen : this.lastGenerationTotals.toString(),
            currentStep : "",
            speciesId : "",
            genusId : "",
            creatureId : "",
            eventType : item[0],
            paramName : item[1].concat(" count"),
            paramValue : item[2].toString(),
            paramValue2 : "",
            paramString : "",
          }
          this.pushEventToLog(aggregatedEvent);
        });
      this.generationTotals = [];
      this.lastGenerationTotals = this.worldController.currentGen;
    }
    this.generationTotals.push([eventValues.eventType, eventValues.paramName])      
  }

  private countEvents(array1: [LogEvent, string][]) : [LogEvent, string, number][] {
    
    // Define types for pairs and count
    type Pair = [LogEvent, string];
    type PairWithCount = [LogEvent, string, number];

    // Create a map to store pair counts
    const pairCounts = new Map<string, number>();

    // Count pairs in stepTotals
    array1.forEach(([event, str]) => {
        const key = `${event}_${str}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    });

    // Convert pairCounts map to generationTotals array
    const array2: PairWithCount[] = [...pairCounts].map(([key, count]) => {
        const [event, str] = key.split('_') as [LogEvent, string];
        return [event, str, count];
    });
    return array2;
  }


}
