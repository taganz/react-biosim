/** constants of the event logger that the log of species and creatures replaced */
const REMOVED_LOG_CONSTANTS = [
  "LOG_ENABLED", "LOG_LEVEL", "LOG_CREATURE_ID", "LOG_STEP_TOTALS", "LOG_EVENTLOGGER_MAX_EVENTS", "LOG_ALLOWED_EVENTS",
];

/**
 * Files saved with the event logger: its constants are dropped. LOG_LOCALE_STRING is kept, and
 * the new LOG_* constants take their defaults.
 */
export default function migrateLogConstants(constants: any): any {
  if (constants === null || typeof constants !== "object") return constants;
  if (!REMOVED_LOG_CONSTANTS.some((key) => key in constants)) return constants;
  const result = { ...constants };
  for (const key of REMOVED_LOG_CONSTANTS) delete result[key];
  return result;
}
