import { LogLevel } from "./LogEvent";
import { LOG_NO_CREATURES } from "./EventLogger";

/**
 * Files saved before LOG_LEVEL was removed: the level now follows LOG_CREATURE_ID.
 * A level below Creature events becomes "no creatures", and Generation totals or
 * World events only turn the step totals off.
 */
export default function migrateLogConstants(constants: any): any {
  if (constants === null || typeof constants !== "object" || constants.LOG_LEVEL === undefined) return constants;
  const { LOG_LEVEL: level, ...rest } = constants;
  return {
    ...rest,
    LOG_CREATURE_ID: level === LogLevel.CREATURE ? rest.LOG_CREATURE_ID : LOG_NO_CREATURES,
    LOG_STEP_TOTALS: level === LogLevel.CREATURE || level === LogLevel.STEP,
  };
}
