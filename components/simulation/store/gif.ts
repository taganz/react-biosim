import GIF from 'gif.js';
import { atom } from "jotai";
export const framesAtom = atom(0);
export const gifAtom = atom<GIF|null>(null);
export const stateInitialAtom = atom(false);
export const stateStartPendingAtom = atom(false);
export const stateRecordingAtom = atom(false);
export const stateSavePendingAtom = atom(false);

