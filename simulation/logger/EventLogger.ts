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
  private genTotals : [LogEvent, string][]=[];
  private resumedAndWaitingForStep1 = true;
  private paused = true; 
  private logCreatureId : number;
  private currentLogLevel : LogLevel;
  //private singleGenerationRecording = false;
  //private fromFirstGenerationRecording = false;
  private firstGenerationRecordingStarted = false;
  private waitingForFirstGenerationRecording = false;
  
  
  private firstGenerationToRecord = 0;
  private recording = false;
  private generationsToRecord = 1;

  private stepIndex = 0;   
  private lastGenLogged  = 0;
  private lastStepLogged = 0;
  //private lastStepTotals = -1;
  //private lastGenTotals  = -1;
  
  

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
  get logCount() : number {
    return this.log.length;
  }
  get thresholdReached(): boolean {
    return  this.log.length >= this.logThreshold;
  }
  get creatureId() : number {
    return this.logCreatureId;
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
  }

  // start recording from next generation continuous
  public resume() {
    if (this.logCount > this.logThreshold) {
      console.warn("EventLogger, can't resume max logCount attained: ", this.logThreshold);
    } 
    else {
      this.paused = false;
      this.firstGenerationToRecord = this.worldController.currentGen + 1;
      this.recording = false;
      this.generationsToRecord = 999999999;
    }
  }

  public deleteLog() {
    this.stepIndex = 0;
    this.lastStepLogged = 0;
    this.lastGenLogged = 0;
    this.log = [];
    this.stepTotals = [];
    this.genTotals =[];
  }

  public startLoggingCreatureId(id: number) {
    this.resume();
    this.currentLogLevel = LogLevel.CREATURE;
    this.logCreatureId = id;
    this.worldController.generations.creatureById(this.logCreatureId).logBasicData();  
  }

  // record 1 generation
  public recordNextGeneration() {
    this.deleteLog();
    this.paused = false;
    this.firstGenerationToRecord = this.worldController.currentGen + 1;
    this.recording = false;
    this.generationsToRecord = 1;
    this.waitingForFirstGenerationRecording = false;
  }

  public recordFirstGeneration() {
    this.deleteLog();
    this.paused = false;
    this.firstGenerationToRecord = 1;
    this.recording = false;
    this.generationsToRecord = 1;
    this.waitingForFirstGenerationRecording = true;
  }
  public recordFromFirstGeneration() {
    this.deleteLog();
    this.paused = false;
    this.firstGenerationToRecord = 1;
    this.recording = false;
    this.generationsToRecord = 999999999;
    this.waitingForFirstGenerationRecording = true;
  }
  
  public logEvent(eventValues: SimulationCallEvent) : void {

    if (this.logCount >= this.logThreshold) {
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
          this.lastStepLogged = this.worldController.currentStep;
          this.lastGenLogged = this.worldController.currentGen;
          this.stepIndex = 1;
          this.generationsToRecord--;
          this.waitingForFirstGenerationRecording = false;
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
              return;
            }
          };
        this.stepIndex++;
    }

    this.logReceivedEvent(eventValues);

    this.lastGenLogged = this.worldController.currentGen;
    this.lastStepLogged = this.worldController.currentStep;
  

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

    if (eventValues.logLevel == LogLevel.CREATURE) {
      this.stepTotals.push([eventValues.eventType, eventValues.paramName])      
      this.genTotals.push([eventValues.eventType, eventValues.paramName])      

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
  
  private pushEventToLog(simulationEvent : SimulationEvent) {
    this.log.push(simulationEvent);
  }

  private aggregateAtStepLevel(eventValues:SimulationCallEvent) {

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

    // Create a map to store pair counts
    const pairCounts = new Map<string, number>();

    // Count pairs in stepTotals
    array1.forEach(([event, str]) => {
        const key = `${event}_${str}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    });

    // Convert pairCounts map to genTotals array
    const array2: PairWithCount[] = [...pairCounts].map(([key, count]) => {
        const [event, str] = key.split('_') as [LogEvent, string];
        return [event, str, count];
    });
    return array2;
  }


}
