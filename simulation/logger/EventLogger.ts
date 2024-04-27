import WorldController from '../world/WorldController';
import {
      LOG_ENABLED,
      LOG_EVENTLOGGER_THRESHOLD_DEFAULT, 
      LOG_CREATURE_ID,
      LOG_LOCALE_STRING,
      LOG_ALLOWED_EVENTS,
      LOG_EVENTLOGGER_MAX_EVENTS,
      LOG_LEVEL}
       from "@/simulation/simulationConstants"
import {LogEvent, AllowedLogEvents, LogLevel} from "@/simulation/logger/LogEvent"
import {LOG_PAUSED_AT_START} from "@/simulation/simulationConstants"

export interface SimulationCallEvent {
  logLevel: LogLevel;
  creatureId: number;
  speciesId: string;
  eventType: LogEvent;
  paramName: string;
  paramValue: number | string;
}

interface SimulationEvent {
  logLevel: string;
  currentGen: string;
  currentStep: string;
  speciesId: string;
  creatureId: string;
  eventType: string;
  paramName: string;
  paramValue: string;
  //timestamp: string;
}

export default class EventLogger {
  private csvHeaders = 'LogLevel;CurrentGen;CurrentStep;SpeciesId;CreatureId;EventType;ParamName;ParamValue\n';
  private worldController : WorldController;
  private readonly logThreshold: number;
  private headerWritten = false;
  private paused = LOG_PAUSED_AT_START;
  // should be reset at reset()
  private log: SimulationEvent[] = [];
  private stepTotals : [LogEvent, string][]=[];
  private generationTotals : [LogEvent, string][]=[];
  private lastStepTotals : number = 0;
  private lastGenerationTotals : number = 0;
  private generationTotalsHaveSeenStepZero : boolean = false;
  

 // constructor(logFilePath: string, logThreshold: number = 10) {
  constructor(worldController : WorldController, logThreshold: number = LOG_EVENTLOGGER_THRESHOLD_DEFAULT) {
    this.worldController = worldController;
    this.logThreshold = logThreshold;
    console.log("eventLogger initialized");
  }


  public logEvent(eventValues: SimulationCallEvent) : void {

    if (this.logCount >= this.logThreshold) {
      this.paused = true;
      return;
    }
    if (this.isPaused) {
      return;
    }

    if (eventValues.logLevel == LogLevel.CREATURE) {
      this.aggregateStepTotalsAndLog(eventValues.eventType, eventValues.paramName);
      this.aggregateGenerationTotalsAndLog(eventValues.eventType, eventValues.paramName);
    }

    if (!this.shouldLogBasedOnSimulationConstants(eventValues)) {
      return;
    }
 
    const simulationEvent : SimulationEvent = {
      logLevel : eventValues.logLevel,
      currentGen : this.worldController.currentGen.toString(),
      currentStep : this.worldController.currentStep.toString(),
      speciesId : eventValues.speciesId,
      creatureId : eventValues.creatureId.toString(),
      eventType : eventValues.eventType,
      paramName : eventValues.paramName,
      paramValue : typeof(eventValues.paramValue)=="string" ? eventValues.paramValue : eventValues.paramValue.toLocaleString(LOG_LOCALE_STRING, {maximumFractionDigits : 2}),
    }
    //const timestamp: string = new Date().toISOString();

    this.log.push(simulationEvent);
    //console.log(`SimulationEvent '${event.eventType}' logged at ${timestamp} by ${logLevel}`);

  }

  private aggregateStepTotalsAndLog(eventValue : LogEvent, paramName: string){
    //TODO don't start recording until step start

    this.stepTotals.push([eventValue, paramName]);

    if (this.worldController.currentStep != this.lastStepTotals) {
        const aggregatedAtStepLevel = this.countEvents(this.stepTotals.map(item => [item[0], item[1]]));
        aggregatedAtStepLevel.map(item => {
            const aggregatedEvent : SimulationEvent = {
              logLevel : LogLevel.STEP,
              currentGen : this.worldController.currentGen.toString(),
              currentStep : this.worldController.currentStep.toString(),
              speciesId : "",
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
  }

  private aggregateGenerationTotalsAndLog(eventValue : LogEvent, paramName: string){
    // don't start recording a generation until step 0
    if (this.worldController.currentStep == 0) {
      this.generationTotalsHaveSeenStepZero = true;
    } 
    if (!this.generationTotalsHaveSeenStepZero) {
      return;
    }

    this.generationTotals.push([eventValue, paramName])      

    if (this.worldController.currentGen != this.lastGenerationTotals) {
      const aggregatedAtGenerationLevel = this.countEvents(this.generationTotals.map(item => [item[0], item[1]]));
      aggregatedAtGenerationLevel.map(item => {
          const aggregatedEvent : SimulationEvent = {
            logLevel : LogLevel.GENERATION,
            currentGen : this.worldController.currentGen.toString(),
            currentStep : this.worldController.currentStep.toString(),
            speciesId : "",
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


  private shouldLogBasedOnSimulationConstants(eventValues: SimulationCallEvent) : boolean {
    // general conditions
    if (!LOG_ENABLED) return false;
    if (!LOG_ALLOWED_EVENTS[eventValues.eventType]) return false;
    if ((eventValues.logLevel == LogLevel.CREATURE) && (LOG_LEVEL == LogLevel.STEP)) return false;
    if ((eventValues.logLevel == LogLevel.CREATURE) && (LOG_LEVEL == LogLevel.GENERATION)) return false;
    if ((eventValues.logLevel == LogLevel.CREATURE) && (LOG_LEVEL == LogLevel.WORLD)) return false;
    if ((eventValues.logLevel == LogLevel.STEP) && (LOG_LEVEL == LogLevel.GENERATION)) return false;
    if ((eventValues.logLevel == LogLevel.STEP) && (LOG_LEVEL == LogLevel.WORLD)) return false;
    if ((eventValues.logLevel == LogLevel.GENERATION) && (LOG_LEVEL == LogLevel.WORLD)) return false;

    // if logging creature log, check id range
    if (eventValues.logLevel == LogLevel.CREATURE) {
      return (LOG_CREATURE_ID == 0 
        || LOG_CREATURE_ID == eventValues.creatureId 
        || (LOG_CREATURE_ID == -10 && eventValues.creatureId > 0 && eventValues.creatureId < 10)
        || (LOG_CREATURE_ID == -30 && eventValues.creatureId > 0 && eventValues.creatureId < 30)
        );
    }
    return true;
  }

  // get events data in blog format to write to file 
  public getLogBlob(): Blob {
    let csvData: string;

    /*
    if (!this.headerWritten) {
      csvData = 'CallerClassName;CurrentGen;CurrentStep;SpeciesId;CreatureId;EventType;ParamName;ParamValue\n';
      this.headerWritten = true;
    } else {
      csvData = "";
    }
    */
    csvData = this.csvHeaders;
    
    for (const event of this.log) {
      csvData += `${event.logLevel};${event.currentGen};${event.currentStep};${event.speciesId};${event.creatureId};${event.eventType};${event.paramName};${event.paramValue}\n`;
    }

    const blob = new Blob([csvData], { type: 'text/plain;charset=utf-8' });
    return blob;
    
  }

  public getLog(): string {
    let csvData: string;

    /*
    if (!this.headerWritten) {
      csvData = 'CallerClassName;CurrentGen;CurrentStep;SpeciesId;CreatureId;EventType;ParamName;ParamValue\n';
      this.headerWritten = true;
    } else {
      csvData = "";
    }
    */
    csvData = this.csvHeaders;
    
    for (const event of this.log) {
      csvData += `${event.logLevel};${event.currentGen};${event.currentStep};${event.speciesId};${event.creatureId};${event.eventType};${event.paramName};${event.paramValue}\n`;
    }

    return csvData;
    
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

  public reset() {
    this.log = [];
    this.generationTotalsHaveSeenStepZero = false;
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

  public start() {
    this.reset();
    this.paused = false;
  }
  public resume() {
    if (this.logCount > LOG_EVENTLOGGER_MAX_EVENTS) {
      console.warn("EventLogger, can't resume max logCount attained: ", LOG_EVENTLOGGER_MAX_EVENTS);
    } 
    else {
      this.paused = false;
    }
  }

}
