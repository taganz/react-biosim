import { LogLevel, LogEvent } from "@/simulation/logger/LogEvent";
import EventLogger from "@/simulation/logger/EventLogger";
import WorldController from "@/simulation/world/WorldController";
import { testWorldControllerData } from "./testWorldControllerData";
import { testWorldGenerationsData } from "./testWorldGenerationsData";

/* https://jestjs.io/docs/expect  */


// ojo, generat amb gpt.....

describe('EventLogger', () => {
    let worldControllerMock: WorldController;
    let logger: EventLogger;
    const mockEvent = {
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


    test('should initialize paused based on constants', () => {
        expect(logger.isPaused).toBeTruthy();
    });

    test('should log an event after resume', () => {
        logger.resume();
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(1); // Check if the event is logged
      });

    test('after reset logger is paused and does not log ', () => {
        logger.reset(); 
        logger.logEvent(mockEvent);
        expect(logger.getLog().includes('value1')).toBeFalsy();
    });
    test('after reset and resume logger is not paused and does log ', () => {
        logger.reset(); 
        logger.resume();
        logger.logEvent(mockEvent);
        expect(logger.getLog().includes('value1')).toBeTruthy();
    });


    
    test('should stop logging after limit', async () => {
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

  
  
    test('should not log an event if paused', () => {
        logger.pause();
        logger.logEvent(mockEvent);
        expect(logger.getLog().includes('value1')).toBeFalsy;
    });

    test('should not log events once the threshold is reached', () => {
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

    test('should aggregate events correctly at step level', () => {
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

    test('should reset logs correctly', () => {
        logger.reset();
        logger.resume();
        logger.logEvent(mockEvent);
        logger.reset();
        expect(logger.getLog()).toBe(logger._csvHeaders); // Should only include headers after reset
    });

    test('should log next generation', () => {
        logger.resume();
        // Simulate steps changing in WorldController
        worldControllerMock.currentStep = 2;

        worldControllerMock.currentGen = 1;
        logger.recordNextGeneration();
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(0);

        worldControllerMock.currentGen = 2;
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(1);
        
        worldControllerMock.currentGen = 3;
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(1);
    });

    
    
});

