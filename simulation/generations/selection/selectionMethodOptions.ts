import {Option} from "../../../components/global/inputs/Dropdown";
import SelectionMethod from "@/simulation/generations/selection/SelectionMethod";
import InsideReproductionAreaSelection from "@/simulation/generations/selection/InsideReproductionAreaSelection";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import GreatestDistanceSelection from "@/simulation/generations/selection/GreatestDistanceSelection"
import ContinuousSelection from "@/simulation/generations/selection/ContinuousSelection";
import GreatestMassSelection from "@/simulation/generations/selection/GreatestMassSelection";

export const selectionMethodOptions: Option[] = [
  {value: "InsideReproductionAreaSelection", label: "Inside Reproduction Area"},
  {value: "GreatestDistanceSelection", label: "Greatest Distance"},
  {value: "GreatestMassSelection", label: "Greatest Mass"},
  {value: "ReproductionSelection", label: "Reproduction"},
  {value: "ContinuousSelection", label: "Continuous"},
];

// Mapping from values to constructor functions
export const selectionMap: { [key: string]: () => SelectionMethod } = {
  "InsideReproductionAreaSelection": () => new InsideReproductionAreaSelection(),
  "GreatestDistanceSelection": () => new GreatestDistanceSelection(),
  "GreatestMassSelection": () => new GreatestMassSelection(),
  "ReproductionSelection": () => new ReproductionSelection(),
  "ContinuousSelection": () => new ContinuousSelection(),
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
