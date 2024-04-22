import {EventLogger, Event} from '@/simulation/logger/EventLogger'; // Assuming your EventLogger class is in EventLogger.ts
import * as fs from 'fs';

/*
// Mock fs.appendFile to make it synchronous for testing
jest.mock('fs', () => ({
    appendFile: jest.fn((path, data, callback) => {
      callback(null); // Call the callback immediately to mimic synchronous behavior
    }),
  }));
*/
describe('EventLogger', () => {
  let logger: EventLogger;
  const TEST_FILENAME = 'test2.csv';
  beforeEach(() => {
    logger = new EventLogger(TEST_FILENAME, 3); // Create a new logger instance before each test
  });

  afterEach(() => {
    // Clear the log and perform any cleanup after each test
    logger.clearLog();
  });

  it('should log an event', () => {
    logger.logEvent({
        callerClassName: "CLASS",
      currentGen: 1,
      currentStep: 2,
      speciesId: 'species123',
      creatureId: 456,
      eventType: 'Event type',
      paramName: 'Parameter name',
      paramValue: 'Parameter value',
    });
    const loggedEvents = logger.getLoggedEvents();
    expect(loggedEvents.length).toBe(1); // Check if the event is logged
  });

  it('should write events to file every N events', async () => {
    logger.logEvent({
        callerClassName: "CLASS",
      currentGen: 1,
      currentStep: 2,
      speciesId: 'species123',
      creatureId: 456,
      eventType: 'Event type',
      paramName: 'Parameter name',
      paramValue: 'Parameter value',
    });
    logger.logEvent({
        callerClassName: "CLASS",
      currentGen: 1,
      currentStep: 2,
      speciesId: 'species456',
      creatureId: 789,
      eventType: 'Another event type',
      paramName: 'Another parameter name',
      paramValue: 'Another parameter value',
    });
    // At this point, the log should not have been written to file yet
    const loggedEvents = logger.getLoggedEvents();
    expect(loggedEvents.length).toBe(2); // Check if both events are logged

    // Log one more event to trigger writing to file
    logger.logEvent({
        callerClassName: "CLASS",
      currentGen: 1,
      currentStep: 2,
      speciesId: 'species78911',
      creatureId: 101112,
      eventType: 'Third event type',
      paramName: 'Third parameter name',
      paramValue: 'Third parameter value',
    });
    // After logging the third event, the log should have been written to file
        const fileExists = fs.existsSync(TEST_FILENAME);
        expect(fileExists).toBe(true);
        // After logging the third event, the log should have been written to file
   //     expect(fs.appendFile).toHaveBeenCalled();
        logger.clearLog();
  });
});