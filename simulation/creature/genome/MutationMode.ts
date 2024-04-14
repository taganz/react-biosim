export enum MutationMode {
  wholeGene = "wholeGene",
  singleBit = "singleBit",
  singleHexDigit = "singleHexDigit",
}

export function deserializeMutationMode(mutationMode: string) : MutationMode {
  if (mutationMode = "wholeGene") return MutationMode.wholeGene;
  if (mutationMode = "singleBit") return MutationMode.singleBit;
  if (mutationMode = "singleHexDigit") return MutationMode.singleHexDigit;
  console.error("error deserializeMutationMode:", mutationMode, " defaulting to MutationMode.wholeGene");
  return MutationMode.wholeGene;
  
}