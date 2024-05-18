import { LogLevel, LogEvent } from "@/simulation/logger/LogEvent";
import EventLogger from "@/simulation/logger/EventLogger";
import WorldController from "@/simulation/world/WorldController";
import { testWorldControllerData } from "./testWorldControllerData";
import { testWorldGenerationsData } from "./testWorldGenerationsData";
import { SimulationCallEvent } from "@/simulation/logger/EventLogger";

/* https://jestjs.io/docs/expect  */


//TODO - write test for getLogBlob...

describe('EventLogger', () => {
    let worldControllerMock: WorldController;
    let logger: EventLogger;
    const mockEvent : SimulationCallEvent = {
        logLevel: LogLevel.CREATURE,
        creatureId: 1,
        speciesId: 'species1',
        genusId: 'genus1',
        eventType: LogEvent.BIRTH,
        paramName: 'param1',
        paramValue: 'value1'
    };

    beforeEach(() => {
        const worldControllerData = testWorldControllerData;
        const worldGenerationsData = testWorldGenerationsData;
        worldControllerMock = new WorldController(worldControllerData, worldGenerationsData);
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


    test('reset() pauses the log', () => {
        const count = logger.logCount;
        logger.reset();
        expect(logger.isPaused).toBeTruthy();
    });
    test('reset() doesn t clear the log', () => {
        const count = logger.logCount;
        logger.reset();
        expect(logger.logCount).toBe(count);
    });

    test('reset() - after reset logger is paused and does not log ', () => {
        logger.reset(); 
        logger.logEvent(mockEvent);
        expect(logger.getLog().includes('value1')).toBeFalsy();
    });
    
    test('resume() - should log an event after resume', () => {
        logger.resume();
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(1); // Check if the event is logged
      });

    test('resume() - after reset and resume logger is not paused and does log ', () => {
        logger.reset(); 
        logger.resume();
        logger.logEvent(mockEvent);
        expect(logger.getLog().includes('value1')).toBeTruthy();
    });
    test('deleteLog() - log has only headers', () => {
        logger.logEvent(mockEvent);
        logger.deleteLog();
        expect(logger.getLog()).toBe(logger._csvHeaders); // Should only include headers after reset
    });
    test('getLog() - correct header', () => {
        const header = "LogLevel;StepIndex;CurrentGen;CurrentStep;SpeciesId;GenusId;CreatureId;EventType;ParamName;ParamValue";
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
            paramValue: 'value1'
        };
        const dataLine = "CREATURE;1;1;1;species1;genus1;1;BIRTH;param1;value1";
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
        logger.logEvent({...mockEvent, paramName: 'param2', paramValue: 'value2'});

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

