import { LogLevel, LogEvent } from "@/simulation/logger/LogEvent";
import EventLogger from "@/simulation/logger/EventLogger";
import WorldController from "@/simulation/world/WorldController";
import { testWorldControllerData } from "./testWorldControllerData";
import { testWorldGenerationsData } from "./testWorldGenerationsData";
import { SimulationCallEvent } from "@/simulation/logger/EventLogger";
import { SIMULATION_DATA_DEFAULT } from "@/simulation/simulationDataDefault";
import { SimulationData } from "@/simulation/SimulationData";


/* https://jestjs.io/docs/expect  */


//TODO - write test for getLogBlob...

describe('EventLogger', () => {
    let worldControllerMock: WorldController;
    let logger: EventLogger;
    let mockEvent : SimulationCallEvent;
    let mockSimulationDataConstants : any;
    let simulationData : SimulationData;
    
    beforeEach(() => {
        mockEvent = {
            logLevel: LogLevel.CREATURE,
            creatureId: 1,
            speciesId: 'species1',
            genusId: 'genus1',
            eventType: LogEvent.BIRTH,
            paramName: 'param1',
            paramValue: 1,
            paramValue2: 2,
            paramString: "joe"
        };
        mockSimulationDataConstants = {
              // -- log 
            LOG_ENABLED : true,  // main switch for logging
            //LOG_RESET_AT_RESTART : true,    // will reset automatically on every restart
            LOG_LEVEL : LogLevel.CREATURE, 
            LOG_CREATURE_ID : 0,   // if 0 all creatures, if -10 ids from 0 to 10, if -30 ids from 0 to 30, else else a id 
            LOG_EVENTLOGGER_MAX_EVENTS : 1000000, // will stop logging at this point
            LOG_LOCALE_STRING : 'es-ES',
            LOG_ALLOWED_EVENTS: {
            // creature
            [LogEvent.INFO]: true,
            [LogEvent.REPRODUCE]: true,
            [LogEvent.REPRODUCE_TRY]: true,
            [LogEvent.PHOTOSYNTHESIS]: true,
            [LogEvent.BIRTH]: true,
            [LogEvent.DEAD]: true,
            [LogEvent.DEAD_ATTACKED]: true,
            [LogEvent.METABOLISM]: true,
            [LogEvent.ATTACK]: true,
            [LogEvent.ATTACK_TRY]: true,
            [LogEvent.MOVE]: true, 
            [LogEvent.MOVE_TRY]: true, 
            // controller
            [LogEvent.GENERATION_START]: true,
            [LogEvent.GENERATION_END]: true,
            [LogEvent.STEP_END]: true,
            },
        }
        //const worldControllerData = testWorldControllerData;
        //const worldGenerationsData = testWorldGenerationsData;
        simulationData = SIMULATION_DATA_DEFAULT;
        simulationData.constants.mockSimulationDataConstants;
        worldControllerMock = new WorldController(simulationData);
        logger = new EventLogger(worldControllerMock, 10);
    });
    afterEach(() => {
        // Clear the log and perform any cleanup after each test
        logger.reset();
      });


    test('constructor() - it is paused on creation', () => {
        expect(logger.isPaused).toBeTruthy();
    });
     
    test('pause() - should not log an event if paused', () => {
        logger.pause();
        logger.logEvent(mockEvent);
        expect(logger.getLog().includes('value1')).toBeFalsy;
    });

    test('resume() after resume can log events', () => {
        logger.resume();
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(1);
    });

    test('reset() pauses the log', () => {
        logger.reset();
        expect(logger.isPaused).toBeTruthy();
    });


    test('reset() doesn t clear the log', () => {
        logger.deleteLog();
        logger.resume();
        logger.logEvent(mockEvent);
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(2);
        logger.reset();
        expect(logger.logCount).toBe(2);
    });

    test('reset() - after reset logger is paused and does not log ', () => {
        logger.reset(); 
        mockEvent.paramValue = 969;
        logger.logEvent(mockEvent);
        expect(logger.getLog().includes('969')).toBeFalsy();
    });
    
    test('resume() - should log an event after resume', () => {
        logger.resume();
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(1); // Check if the event is logged
      });

    test('resume() - after reset and resume logger is not paused and does log ', () => {
        logger.reset(); 
        logger.resume();
        mockEvent.paramValue = 969;
        logger.logEvent(mockEvent);
        expect(logger.getLog().includes('969')).toBeTruthy();
    });
    test('deleteLog() - log has only headers', () => {
        logger.logEvent(mockEvent);
        logger.deleteLog();
        expect(logger.getLog()).toBe(logger._csvHeaders); // Should only include headers after reset
    });
    test('getLog() - correct header', () => {
        const header = "LogLevel;StepIndex;CurrentGen;CurrentStep;SpeciesId;GenusId;CreatureId;EventType;ParamName;ParamValue;ParamValue2;ParamString";
        logger.logEvent(mockEvent);
        expect(logger.getLog().includes(header)).toBeTruthy();
    });
    test('getLog() - correct data line', () => {
        const mockEvent : SimulationCallEvent = {
            logLevel: LogLevel.CREATURE,
            creatureId: 1,
            speciesId: 'species1',
            genusId: 'genus1',
            eventType: LogEvent.BIRTH,
            paramName: 'param1',
            paramValue: 1,
            paramValue2: 2,
            paramString: "joe"
        };
        const dataLine = "CREATURE;1;1;1;species1;genus1;1;BIRTH;param1;1;2;joe";
        logger.reset();
        logger.resume();
        logger.logEvent(mockEvent);
        //console.log("getLog() test ---- \n", logger.getLog());
        expect(logger.getLog().includes(dataLine)).toBeTruthy();
    });
    test('threshold - should stop logging after limit', async () => {
        const logger3 = new EventLogger(worldControllerMock, 3); 
        logger3.reset();
        logger3.resume();
        logger3.logEvent(mockEvent);
        logger3.logEvent(mockEvent);
        logger3.logEvent(mockEvent);
        logger3.logEvent(mockEvent);
        console.log(logger3.getLog());
        expect(logger3.logCount).toBe(3); // only 3 logs
    });

  
 
    test('threshold - should not log events once the threshold is reached', () => {
        logger.resume();
        for (let i = 0; i < 11; i++) {
            logger.logEvent({...mockEvent, creatureId: i});
        }
        expect(logger.logCount).toBe(10);
    });

    /*
    test('should handle different log levels correctly', () => {
        logger.start();
        logger.logEvent({...mockEvent, logLevel: LogLevel.WORLD});
        expect(logger.getLog()).not.toInclude('value1'); // Assuming World level isn't logged due to the current configuration
    });
*/

    test('logEvent() - should aggregate events correctly at step level', () => {
        logger.resume();
        // Simulate steps changing in WorldController
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);
        worldControllerMock.currentStep = 2; // Changing step
        logger.logEvent({...mockEvent, paramName: 'param2', paramValue: 1});

        // Verify aggregation
        const log = logger.getLog();
        expect(log.includes('count')).toBeTruthy();
    });


    test('recordNextGeneration() - should log one generation after current', () => {
        logger.resume();
        
        // gen 1

        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 1;        
        logger.recordNextGeneration();  // call function
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(0);

        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 2;
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(0);

        // gen 2

        worldControllerMock.currentGen = 2;
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(1);
        
        worldControllerMock.currentGen = 2;
        worldControllerMock.currentStep = 2;
        logger.logEvent(mockEvent);
        //console.log(logger.getLog());
        expect(logger.logCount).toBe(3);  // es 3 perque afegeix STEP TOTALS

        // gen 3
        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(3);
    });

    test('recordFirsttGeneration() - should log only the first generation', () => {
        logger.resume();
        
        // gen 1

        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 1;        
        logger.recordFirstGeneration();  // call function
        logger.logEvent(mockEvent);             // not logged
        expect(logger.logCount).toBe(0);

        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 2;
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(0);   // not logged

        // gen 1
        logger.reset();  // called by worldController at reset

        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);             // +1 creature event
        expect(logger.logCount).toBe(1);
        
        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 2;
        logger.logEvent(mockEvent);             // +1 creature event
        //console.log(logger.getLog());
        expect(logger.logCount).toBe(3);  // 2 creature event + 1 step event

        // gen 1
        worldControllerMock.currentGen = 2;
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);              // +1 creature event
        console.log(logger.getLog());
        expect(logger.logCount).toBe(3);  // 3 creatures + 2 (!) step + 1 gen event
    });

    
    test('recordFromFirsttGeneration() - should log from first generation', () => {
        logger.resume();
        
        // gen 1

        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 1;        
        logger.recordFromFirstGeneration();  // call function
        logger.logEvent(mockEvent);             // not logged
        expect(logger.logCount).toBe(0);

        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 2;
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(0);   // not logged

        // gen 0
        logger.reset();  // called by worldController at reset

        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);             // +1 creature event
        expect(logger.logCount).toBe(1);
        
        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 2;
        logger.logEvent(mockEvent);             // +1 creature event
        //console.log(logger.getLog());
        expect(logger.logCount).toBe(3);  // 2 creature event + 1 step event

        // gen 1
        worldControllerMock.currentGen = 2;
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);              // +1 creature event
        console.log(logger.getLog());
        expect(logger.logCount).toBe(6);  // 3 creatures + 2 (!) step + 1 gen event
    });

    
    
    
});

