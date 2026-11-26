import migrateLogConstants from "@/simulation/log/migrateLogConstants";

describe('migrateLogConstants', () => {
    test('leaves constants without the old ones as they are', () => {
        const constants = { LOG_SPECIES: true, LOG_LOCALE_STRING: "es-ES" };
        expect(migrateLogConstants(constants)).toBe(constants);
    });

    test('drops the constants of the event logger and keeps the locale', () => {
        expect(migrateLogConstants({
            LOG_ENABLED: true, LOG_LEVEL: 1, LOG_CREATURE_ID: 12, LOG_STEP_TOTALS: true,
            LOG_EVENTLOGGER_MAX_EVENTS: 10, LOG_ALLOWED_EVENTS: { MOVE: true }, LOG_LOCALE_STRING: "en-US", SIM_CODE_LENGTH: 3,
        })).toEqual({ LOG_LOCALE_STRING: "en-US", SIM_CODE_LENGTH: 3 });
    });
});
