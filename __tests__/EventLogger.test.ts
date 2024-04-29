import EventLogger, {SimulationCallEvent} from '@/simulation/logger/EventLogger'; 
import { LogEvent, LogLevel } from '@/simulation/logger/LogEvent';
import WorldController from '@/simulation/world/WorldController';
import WorldControllerData from '@/simulation/world/WorldControllerData';
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import { testWorldControllerData } from "./testWorldControllerData";
import { testWorldGenerationsData } from "./testWorldGenerationsData";

import * as fs from 'fs';

/*
// Mock fs.appendFile to make it synchronous for testing
jest.mock('fs', () => ({
    appendFile: jest.fn((path, data, callback) => {
      callback(null); // Call the callback immediately to mimic synchronous behavior
    }),
  }));
*/

//jest.mock('@/simulation/world/WorldController', () => ({ currentGen: 0, currentStep: 0 }))

describe('EventLogger', () => {
  let logger: EventLogger;
  const TEST_FILENAME = 'test2.csv';
  const worldControllerData = testWorldControllerData;
  const worldGenerationsData = testWorldGenerationsData;
  const worldController = new WorldController(worldControllerData, worldGenerationsData);
  var event1 : SimulationCallEvent = 
  {
    logLevel: LogLevel.CREATURE,
    creatureId: 456,
    speciesId: 'species123',
    genusId: "genus123",
    eventType: LogEvent.ATTACK,
    paramName: 'Parameter name',
    paramValue: 'Parameter value',
  };

  beforeEach(() => {
    logger = new EventLogger(worldController, 3); // Create a new logger instance before each test
  });

  afterEach(() => {
    // Clear the log and perform any cleanup after each test
    logger.reset();
  });

  test('should log an event', () => {
    logger.start();
    logger.logEvent(event1);
    expect(logger.logCount).toBe(1); // Check if the event is logged
  });

  test('should stop logging after limit', async () => {
    const logger3 = new EventLogger(worldController, 3); // Create a new logger instance before each test
    logger3.start();
    logger3.logEvent(event1);
    logger3.logEvent(event1);
    logger3.logEvent(event1);
    logger3.logEvent(event1);
    console.log(logger3.getLog());
    expect(logger3.logCount).toBe(3); // Check if the event is logged
  });

  /*
  test('should aggregate at step level ', async () => {
    worldControllerData.stepsPerGen = 3;
    worldControllerData.initialPopulation = 1;
    logger.start();
    worldController.startRun(worldControllerData, worldGenerationsData)
    
    console.log(logger3.getLog());
    //expect(logger3.logCount).toBe(3); // Check if the event is logged
  });

*/


});