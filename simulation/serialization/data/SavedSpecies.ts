import SavedCreature from "./SavedCreature";

export default interface SavedSpecies {
  genes: number[];
  creatures: SavedCreature[];
  /** speciesId and the species it came from (see speciesId.ts); older files do not have them,
   *  and their species are roots with an id computed from the genes */
  id?: string;
  parentId?: string | null;
  /** generation in which the species appeared */
  firstGen?: number;
}
