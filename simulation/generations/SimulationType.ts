/**
 * generational: at the end of each generation the selection method picks the
 * survivors and the population strategy builds the next generation from them.
 * continuous: a generation is only a time window for stats, logs and file names;
 * creatures carry on, reproduce with the Reproduction action and die of hunger,
 * attacks or old age (maxAge).
 */
export type SimulationType = "generational" | "continuous";
