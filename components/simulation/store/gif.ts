
import { atom } from "jotai";
export const recordingAtom = atom(false);
export const recordingStopPendingAtom = atom(false);
export const savePendingAtom = atom(false);
export const framesAtom = atom(0);
export const gifAtom = atom<GIF|null>(null);

    