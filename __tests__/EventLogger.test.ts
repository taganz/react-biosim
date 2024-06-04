import { LogLevel, LogEvent } from "@/simulation/logger/LogEvent";
import EventLogger from "@/simulation/logger/EventLogger";
import WorldController from "@/simulation/world/WorldController";
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
            paramName: 'massAtBirth',
            paramValue: 1,
            paramValue2: 0,
            paramString: ''
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
        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 1;
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
    test('resume() - event logging starts always at step 0 ', () => {
        
        worldControllerMock.currentGen = 10;
        worldControllerMock.currentStep = 3;        
        logger.resume();     
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(0);
        worldControllerMock.currentStep = 4;        
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(0);
        worldControllerMock.currentStep = 5;        
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(0);
        worldControllerMock.currentGen = 11;        
        worldControllerMock.currentStep = 1;        
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(1);
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
            speciesId: 'species1',
            genusId: 'genus1',
            creatureId: 1,
            eventType: LogEvent.BIRTH,
            paramName: 'massAtBirth',
            paramValue: 1,
            paramValue2: 0,
            paramString: ""
        };
        const dataLine = "CREATURE;1;1;1;species1;genus1;1;BIRTH;massAtBirth;1;0;";
        logger.reset();
        logger.resume();
        logger.logEvent(mockEvent);
        console.log("getLog() - correct data line ---- \n\n", logger.getLog());
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
        //console.log(logger3.getLog());
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



    test('logEvent() - step index is 1 at beginning of log', () => {
        logger.resume();
        logger.logEvent(mockEvent);
        // Simulate steps changing in WorldController
        const log = logger.getLog();
        expect(log.includes("CREATURE;1")).toBeTruthy();
    });

    test('logEvent() - should aggregate events at step and generation levels', () => {
        logger.resume();
        // Simulate steps changing in WorldController
        logger.logEvent(mockEvent);
        logger.logEvent({...mockEvent, eventType: LogEvent.METABOLISM,
                        creatureId: 101, paramName: 'mass', paramValue: 1});
        logger.logEvent({...mockEvent, eventType: LogEvent.METABOLISM,
                        creatureId: 102, paramName: 'mass', paramValue: 1});
        logger.logEvent({...mockEvent, eventType: LogEvent.METABOLISM,
                        creatureId: 103, paramName: 'mass', paramValue: 1});
        worldControllerMock.currentGen = 2; 
        worldControllerMock.currentStep = 1; 
        logger.logEvent({...mockEvent, eventType: LogEvent.METABOLISM,
            creatureId: 103, paramName: 'mass', paramValue: 1});
            
        console.log("logEvent() - should aggregate events at step and generation levels\n\n", logger.getLog());

        // Verify aggregation
        const log = logger.getLog();
        expect(log.includes("STEP TOTALS;1;1;1;;;;BIRTH;massAtBirth sum;1;;")).toBeTruthy();
        expect(log.includes("STEP TOTALS;1;1;1;;;;METABOLISM;mass sum;3;;")).toBeTruthy();
        expect(log.includes("GENERATION TOTALS;1;1;;;;;BIRTH;massAtBirth sum;1;;")).toBeTruthy();
        expect(log.includes("GENERATION TOTALS;1;1;;;;;METABOLISM;mass sum;3;;")).toBeTruthy();
    });

    test('logEvent() - aggregate step events at step level', () => {
        logger.resume();

        // generation 1 step 1
        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 1;
        logger.logEvent({...mockEvent, creatureId: 1});
        logger.logEvent({...mockEvent, creatureId: 2});
        logger.logEvent({...mockEvent, creatureId: 3});
        
        // step 2
        worldControllerMock.currentGen = 1; 
        worldControllerMock.currentStep = 2; // Changing step
        logger.logEvent({...mockEvent, creatureId: 4});

        console.log("logEvent() - aggregate step events at step level");
        console.log(logger.getLog());

        expect(logger.getLog().includes('STEP TOTALS;1;1;1')).toBeTruthy();
    });


    test('recordNextGeneration() - should log one generation after current', () => {
        logger.resume();
        
        // gen 1

        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 2;        
        logger.recordNextGeneration();  // call function
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(0);

        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 3;
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
        expect(logger.logCount).toBe(3);  // 1 step totals + 2 creatures

        // gen 3
        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);
        console.log("recordNextGeneration() - should log one generation after current\n\n", logger.getLog());
        expect(logger.logCount).toBe(5);    // 1 gen totals + 2 step totals + 2 creatures
    });


    test('recordFirsttGeneration() -  is not paused after call ', () => {
        logger.pause();
        
        // gen 3

        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 1;        
        logger.recordFirstGeneration();  // call function
        expect(logger.isPaused).toBeFalsy();
    });
    test('recordFirsttGeneration() -  log is empty after call ', () => {
        logger.resume();
        
        // gen 3

        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 1;        
        logger.recordFirstGeneration();  // call function
        expect(logger.logCount).toBe(0);
    });
    test('recordFirsttGeneration() - doesn t log until first generation ', () => {
        logger.resume();
        
        // gen 3

        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 2;        
        logger.recordFirstGeneration();  // call function
        logger.logEvent(mockEvent);             // not logged
        expect(logger.logCount).toBe(0);
    });

    
    test('recordFirsttGeneration() - log only first generation for complete generation', () => {
        logger.resume();
        
        // gen 3

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
        expect(logger.logCount).toBe(1);        // 1 creature
        
        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 2;
        logger.logEvent(mockEvent);             // +1 creature event
        //console.log(logger.getLog());
        expect(logger.logCount).toBe(3);        // 2 creature event + 1 step event

        // gen 2
        worldControllerMock.currentGen = 2;
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);              // +1 creature event
        expect(logger.logCount).toBe(5);        // 1 gen totas + 2 step totals + 2 creatures
        console.log("recordFirsttGeneration() - log only first generation for complete generation\n\n", logger.getLog());
    });

    test('recordFirsttGeneration() - log complete generation and generation totals', () => {
        logger.resume();
        
        logger.recordFirstGeneration();  // call function

        // gen 3 not logged
        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 1;        
        logger.logEvent(mockEvent);             
        expect(logger.logCount).toBe(0);


        // worldcontroller reset
        logger.reset();  

        // gen 1 
        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);             // +1 creature event
        expect(logger.logCount).toBe(1);
        
        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 2;
        logger.logEvent(mockEvent);             // +1 creature event
        expect(logger.logCount).toBe(3);        // 1 step change + 2 creature      

        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 3;
        logger.logEvent(mockEvent);             // +1 creature event
        expect(logger.logCount).toBe(5);        // 2 step change + 3 creature

        // gen 2
        worldControllerMock.currentGen = 2;
        worldControllerMock.currentStep = 1;
        logger.logEvent(mockEvent);              
        //console.log(logger.getLog());
        expect(logger.logCount).toBe(7);        // 1 gen total + 3 step total + 3 creature

        console.log("recordFirsttGeneration() - log complete generation and generation totals---- \n\n", logger.getLog());

        const log = logger.getLog();
        expect(log.includes("GENERATION TOTALS;3")).toBeTruthy();

    });

    test('recordFirsttGeneration() - log only first generation for partial generation when extintion', () => {
        logger.resume();
        
        // gen 3

        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 1;        
        logger.recordFirstGeneration();  // call function
        logger.logEvent(mockEvent);             // not logged
        expect(logger.logCount).toBe(0);

        worldControllerMock.currentGen = 3;
        worldControllerMock.currentStep = 2;
        logger.logEvent(mockEvent);
        expect(logger.logCount).toBe(0);   // not logged

        // gen 1 step 1
        logger.reset();  // called by worldController at reset

        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 1;
        logger.logEvent({...mockEvent, creatureId: 101});             // +1 creature event
        logger.logEvent({...mockEvent, creatureId: 102});             // +1 creature event
        
        expect(logger.logCount).toBe(2);                           // 2 creatures 
        
        // gen 1 step 2
        
        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 2;
        logger.logEvent({...mockEvent, creatureId: 101});             // +1 creature event
        logger.logEvent({...mockEvent, creatureId: 102});             // +1 creature event
        expect(logger.logCount).toBe(5);                        // step 1 totals + 4 creatures

        // extintion happen and simulation reset!

        // gen 1 but step 1 again
        logger.reset();
        worldControllerMock.currentGen = 1;
        worldControllerMock.currentStep = 1;
        logger.logEvent({...mockEvent, creatureId: 201});               // +1 creature event
        expect(logger.isPaused).toBeTruthy;
        console.log("recordFirsttGeneration() - log only first generation for partial generation when extintion\n\n", logger.getLog());
        expect(logger.logCount).toBe(5);                            //  1 step + 4 creatures, could not record gen stats


        
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
        //console.log(logger.getLog());
        expect(logger.logCount).toBe(6);  // 3 creatures + 2 (!) step + 1 gen event
    });

    
    
    
});

