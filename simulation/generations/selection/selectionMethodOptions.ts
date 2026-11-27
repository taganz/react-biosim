import {Option} from "../../../components/global/inputs/Dropdown";
import SelectionMethod from "@/simulation/generations/selection/SelectionMethod";
import InsideReproductionAreaSelection from "@/simulation/generations/selection/InsideReproductionAreaSelection";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import GreatestDistanceSelection from "@/simulation/generations/selection/GreatestDistanceSelection"
import GreatestMassSelection from "@/simulation/generations/selection/GreatestMassSelection";

export interface SelectionMethodOption extends Option {
  description: string;
  // it ignores mass, so with metabolism creatures starve before the selection (see docs)
  withoutMetabolismOnly?: boolean;
}

export const selectionMethodOptions: SelectionMethodOption[] = [
  {value: "InsideReproductionAreaSelection", label: "Inside Reproduction Area", withoutMetabolismOnly: true,
    description: "Creatures alive inside a reproduction area at the last step of the generation survive. Not available with metabolism."},
  {value: "GreatestDistanceSelection", label: "Greatest Distance (in dev)",
    description: "The 5% of creatures with the highest distance index, which rewards long straight runs, survive."},
  {value: "GreatestMassSelection", label: "Greatest Mass (hervivores only)",
    description: "Only animals can survive: the heaviest ones, as many as 5% of all creatures."},
  {value: "ReproductionSelection", label: "Reproduction",
    description: "Creatures born during the generation with the Reproduction action survive. The water is not reset between generations."},
];

// the method used instead when metabolism is turned on with one that does not allow it
export const METABOLISM_FALLBACK_SELECTION = "ReproductionSelection";

export function isSelectionAllowed(name: string, metabolismEnabled: boolean): boolean {
  return !metabolismEnabled || !selectionMethodOptions.find((option) => option.value === name)?.withoutMetabolismOnly;
}

// Mapping from values to constructor functions
export const selectionMap: { [key: string]: () => SelectionMethod } = {
  "InsideReproductionAreaSelection": () => new InsideReproductionAreaSelection(),
  "GreatestDistanceSelection": () => new GreatestDistanceSelection(),
  "GreatestMassSelection": () => new GreatestMassSelection(),
  "ReproductionSelection": () => new ReproductionSelection(),
};



export function selectSelectionMethod(value: string): SelectionMethod {
  const strategyConstructor = selectionMap[value];
  if (strategyConstructor) {
    return strategyConstructor();
  } else {
    console.warn("selectionMethodObjectList invalid value: ", value);
    return new InsideReproductionAreaSelection(); // default case
  }
}
