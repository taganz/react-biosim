/*
 * The engine's random number generator. Every random decision of the simulation goes
 * through it, so a run started from the same seed repeats exactly (same code, same JS engine).
 *
 * mulberry32: the whole state is one 32-bit integer, which a .sim file saves as rngState.
 * There is one generator for the whole engine, like Math.random: the order of the calls matters.
 */

let state = randomSeed();

/** A new random seed, from Math.random: used when the run has no seed of its own */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}

export function setSeed(seed: number): void {
  state = seed >>> 0;
}

/** The current state: setRandomState() with it goes on with the same numbers */
export function getRandomState(): number {
  return state;
}

export function setRandomState(savedState: number): void {
  state = savedState >>> 0;
}

/** A number in [0, 1), like Math.random() */
export function random(): number {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
}

/** An integer in [0, max) */
export function randomInt(max: number): number {
  return Math.floor(random() * max);
}

/** A shuffled copy of the array (Fisher-Yates) */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
