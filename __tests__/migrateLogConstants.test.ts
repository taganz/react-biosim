import migrateLogConstants from "@/simulation/logger/migrateLogConstants";
import { LOG_NO_CREATURES } from "@/simulation/logger/EventLogger";
import { LogLevel } from "@/simulation/logger/LogEvent";

describe('migrateLogConstants', () => {
    test('leaves constants without LOG_LEVEL as they are', () => {
        const constants = { LOG_CREATURE_ID: 0, LOG_STEP_TOTALS: false };
        expect(migrateLogConstants(constants)).toBe(constants);
    });

    test('Creature events keeps the creature filter and the step totals', () => {
        expect(migrateLogConstants({ LOG_LEVEL: LogLevel.CREATURE, LOG_CREATURE_ID: 12 }))
            .toEqual({ LOG_CREATURE_ID: 12, LOG_STEP_TOTALS: true });
    });

    test('Step totals logs no creatures, with the step totals', () => {
        expect(migrateLogConstants({ LOG_LEVEL: LogLevel.STEP, LOG_CREATURE_ID: 0 }))
            .toEqual({ LOG_CREATURE_ID: LOG_NO_CREATURES, LOG_STEP_TOTALS: true });
    });

    test('Generation totals and World events log no creatures and no step totals', () => {
        for (const level of [LogLevel.GENERATION, LogLevel.WORLD]) {
            expect(migrateLogConstants({ LOG_LEVEL: level, LOG_CREATURE_ID: 0 }))
                .toEqual({ LOG_CREATURE_ID: LOG_NO_CREATURES, LOG_STEP_TOTALS: false });
        }
    });
});
