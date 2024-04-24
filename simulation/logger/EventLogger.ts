import WorldController from '../world/WorldController';
import {
      LOG_ENABLED,
      EVENTLOGGER_LOG_THRESHOLD_DEFAULT, 
      DEBUG_CREATURE_ID,
      LOCALE_STRING,
      ALLOWED_LOG_EVENTS,
      EVENTLOGGER_LOG_MAX_EVENTS,
      ALLOWED_LOG_CLASSES}
       from "@/simulation/simulationConstants"
import {LogEvent, AllowedLogEvents, LogClasses, AllowedLogClasses} from "@/simulation/logger/LogEvent"

export interface SimulationCallEvent {
  callerClassName: LogClasses;
  creatureId: number;
  eventType: LogEvent;
  paramName: string;
  paramValue: number | string;
}

interface SimulationEvent {
  callerClassName: string;
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
  private worldController : WorldController;
  private readonly logThreshold: number;
  private log: SimulationEvent[];
  private headerWritten = false;
  private paused = false;
  public logCount2 = 0;

 // constructor(logFilePath: string, logThreshold: number = 10) {
  constructor(worldController : WorldController, logThreshold: number = EVENTLOGGER_LOG_THRESHOLD_DEFAULT) {
    this.worldController = worldController;
    this.log = [];
    this.logThreshold = logThreshold;
    console.log("eventLogger initialized");
  }


  public logEvent(eventValues: SimulationCallEvent) : void {

    if (this.logCount > EVENTLOGGER_LOG_MAX_EVENTS) {
      this.paused = true;
      return;
    }
    if (this.isPaused) {
      return;
    }

    if (!this.shouldLogBasedOnSimulationConstants(eventValues)) {
      return;
    }
 
    const simulationEvent : SimulationEvent = {
      callerClassName : eventValues.callerClassName,
      currentGen : this.worldController.currentGen.toString(),
      currentStep : this.worldController.currentStep.toString(),
      speciesId : eventValues.callerClassName==LogClasses.CREATURE ? "speciesId_PENDING" : "",
      creatureId : eventValues.creatureId.toString(),
      eventType : eventValues.eventType,
      paramName : eventValues.paramName,
      paramValue : typeof(eventValues.paramValue)=="string" ? eventValues.paramValue : eventValues.paramValue.toLocaleString(LOCALE_STRING, {maximumFractionDigits : 2}),
    }
    //const timestamp: string = new Date().toISOString();

    this.log.push(simulationEvent);
    this.logCount2+=1;
    //console.log(`SimulationEvent '${event.eventType}' logged at ${timestamp} by ${callerClassName}`);

  }

  private shouldLogBasedOnSimulationConstants(eventValues: SimulationCallEvent) : boolean {
    // general conditions
    if (   !LOG_ENABLED
        || !ALLOWED_LOG_EVENTS[eventValues.eventType]
        || !ALLOWED_LOG_CLASSES[eventValues.callerClassName]) {
          return false;
        }
    // if logging creature log, check id range
    if (eventValues.callerClassName == LogClasses.CREATURE) {
      return (DEBUG_CREATURE_ID == 0 
        || DEBUG_CREATURE_ID == eventValues.creatureId 
        || (DEBUG_CREATURE_ID == -10 && eventValues.creatureId > 0 && eventValues.creatureId < 10)
        || (DEBUG_CREATURE_ID == -30 && eventValues.creatureId > 0 && eventValues.creatureId < 30)
        );
    }
    return true;
  }

  // Method to write logged events to file in CSV format
  public getLogBlob(): Blob {
    let csvData: string;

    if (!this.headerWritten) {
      csvData = 'CallerClassName;CurrentGen;CurrentStep;SpeciesId;CreatureId;EventType;ParamName;ParamValue\n';
      this.headerWritten = true;
    } else {
      csvData = "";
    }
    
    for (const event of this.log) {
      csvData += `${event.callerClassName};${event.currentGen};${event.currentStep};${event.speciesId};${event.creatureId};${event.eventType};${event.paramName};${event.paramValue}\n`;
    }

    const blob = new Blob([csvData], { type: 'text/plain;charset=utf-8' });
    return blob;
    
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
    this.logCount2 = 0;

  }
  public pause() {
    this.paused = true;
  }

  public resume() {
    if (this.logCount > EVENTLOGGER_LOG_MAX_EVENTS) {
      console.warn("EventLogger, can't resume max logCount attained: ", EVENTLOGGER_LOG_MAX_EVENTS);
    } 
    else {
      this.paused = false;
    }
  }

}
