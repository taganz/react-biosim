export enum MutationMode {
  wholeGene = "wholeGene",
  singleBit = "singleBit",
  singleHexDigit = "singleHexDigit",
}

export type SavedMutationMode = string;

export function serializeMutationMode(mutationMode: MutationMode) : SavedMutationMode {
  if (mutationMode = MutationMode.wholeGene) return "wholeGene";
  if (mutationMode = MutationMode.singleBit) return "singleBit";
  if (mutationMode = MutationMode.singleHexDigit) return "singleHexDigit";
  console.error("error serializeMutationMode:", mutationMode, " defaulting to wholeGene");
  return "wholeGene";
  
}
export function deserializeMutationMode(savedMutationMode: SavedMutationMode) : MutationMode {
  if (savedMutationMode = "wholeGene") return MutationMode.wholeGene;
  if (savedMutationMode = "singleBit") return MutationMode.singleBit;
  if (savedMutationMode = "singleHexDigit") return MutationMode.singleHexDigit;
  console.error("error deserializeMutationMode:", savedMutationMode, " defaulting to MutationMode.wholeGene");
  return MutationMode.wholeGene;
  
}