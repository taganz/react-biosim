import WorldController from '../world/WorldController';
import {
      LOG_ENABLED,
      LOG_CREATURE_ID,
      LOG_LOCALE_STRING,
      LOG_ALLOWED_EVENTS,
      LOG_EVENTLOGGER_MAX_EVENTS,
      LOG_LEVEL,
 //     LOG_RESET_AT_RESTART
    } from "@/simulation/simulationConstants"
import {LogEvent, LogLevel} from "@/simulation/logger/LogEvent"

export interface SimulationCallEvent {
  logLevel: LogLevel;
  creatureId: number | string;
  speciesId: string;
  genusId: string;
  eventType: LogEvent;
  paramName: string;
  paramValue: number | string;
}

interface SimulationEvent {
  logLevel: string;
  currentGen: string;
  currentStep: string;
  speciesId: string;
  genusId: string;
  creatureId: string;
  eventType: string;
  paramName: string;
  paramValue: string;
}

export default class EventLogger {
  _csvHeaders = 'LogLevel;CurrentGen;CurrentStep;SpeciesId;GenusId;CreatureId;EventType;ParamName;ParamValue\n';
  private worldController : WorldController;
  private readonly logThreshold: number;
  // should be reset at reset()
  private log: SimulationEvent[] = [];
  private stepTotals : [LogEvent, string][]=[];
  private generationTotals : [LogEvent, string][]=[];
  private lastStepTotals : number = 0;
  private lastGenerationTotals : number = 0;
  private generationTotalsHaveSeenStepZero : boolean = false;
  private paused = true; 
  private logCreatureId : number = LOG_CREATURE_ID;
  private currentLogLevel : LogLevel = LOG_LEVEL;
  private singleGenerationRecording = false;
  private firstGenerationRecording = false;
  private firstGenerationRecordingStarted = false;
  private generationToRecord = 0;
  

 // constructor(logFilePath: string, logThreshold: number = 10) {
  constructor(worldController : WorldController, logThreshold: number = LOG_EVENTLOGGER_MAX_EVENTS) {
    this.worldController = worldController;
    this.logThreshold = logThreshold;
    console.log("eventLogger initialized");
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
    // if (LOG_RESET_AT_RESTART) {
    //   deleteLog()
    // }
    this.pause();
 
   }
 
  public deleteLog() {
    this.log = [];
    this.stepTotals = [];
    this.generationTotals =[];
    this.lastStepTotals = 0;
    this.lastGenerationTotals = 0;
    this.generationTotalsHaveSeenStepZero = false;
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
    this.deleteLog();
    this.resume();
  }
  private recordFirstGenerationFinished() {
    this.firstGenerationRecording = false;
    this.firstGenerationRecordingStarted = false;
    this.pause();
  }

  
  public logEvent(eventValues: SimulationCallEvent) : void {

    if (this.logCount >= this.logThreshold) {
      this.paused = true;
      return;
    }
    if (this.isPaused) return;
    if (!LOG_ENABLED) return ;
    if (!LOG_ALLOWED_EVENTS[eventValues.eventType]) return;

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
          && (this.worldController.currentGen > 0 || (this.worldController.currentGen == 0 && this.worldController.currentStep > 1))) {
      // not restarted yet
      return;
    }
    if (this.firstGenerationRecording && !this.firstGenerationRecordingStarted && this.worldController.currentGen == 0 && this.worldController.currentStep == 1) {
      // started
      this.firstGenerationRecordingStarted = true;
    }
    if (this.firstGenerationRecording && this.firstGenerationRecordingStarted && this.worldController.currentGen > 0) {
      this.recordFirstGenerationFinished();
      return;
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

    csvData = this._csvHeaders;
    
    for (const event of this.log) {
      csvData += `${event.logLevel};${event.currentGen};${event.currentStep};${event.speciesId};${event.genusId};${event.creatureId};${event.eventType};${event.paramName};${event.paramValue}\n`;
    }

    const blob = new Blob([csvData], { type: 'text/plain;charset=utf-8' });
    return blob;
    
  }

  public getLog(): string {
    let csvData: string;

    csvData = this._csvHeaders;
    
    for (const event of this.log) {
      csvData += `${event.logLevel};${event.currentGen};${event.currentStep};${event.speciesId};${event.creatureId};${event.eventType};${event.paramName};${event.paramValue}\n`;
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
      currentGen : this.worldController.currentGen.toString(),
      currentStep : this.worldController.currentStep.toString(),
      speciesId : eventValues.speciesId,
      genusId : eventValues.genusId,
      creatureId : eventValues.creatureId.toString(),
      eventType : eventValues.eventType,
      paramName : eventValues.paramName,
      paramValue : typeof(eventValues.paramValue)=="string" ? eventValues.paramValue : eventValues.paramValue.toLocaleString(LOG_LOCALE_STRING, {maximumFractionDigits : 2}),
    }

    this.log.push(simulationEvent);

  }

  private aggregateAtStepLevel(eventValues:SimulationCallEvent) {
    //TODO don't start recording until step start

    if (this.worldController.currentStep != this.lastStepTotals) {
        const aggregatedAtStepLevel = this.countEvents(this.stepTotals.map(item => [item[0], item[1]]));
        aggregatedAtStepLevel.map(item => {
            const aggregatedEvent : SimulationEvent = {
              logLevel : LogLevel.STEP,
              currentGen : this.lastGenerationTotals.toString(),
              currentStep : this.lastStepTotals.toString(),
              speciesId : "",
              genusId : "",
              creatureId : "",
              eventType : item[0],
              paramName : item[1].concat(" count"),
              paramValue : item[2].toString(),
            }
            this.log.push(aggregatedEvent);
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
            currentGen : this.lastGenerationTotals.toString(),
            currentStep : "",
            speciesId : "",
            genusId : "",
            creatureId : "",
            eventType : item[0],
            paramName : item[1].concat(" count"),
            paramValue : item[2].toString(),
          }
          this.log.push(aggregatedEvent);
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
