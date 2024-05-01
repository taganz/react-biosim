import {Option} from "../../../global/inputs/Dropdown";
import SelectionMethod from "@/simulation/generations/selection/SelectionMethod";
import InsideReproductionAreaSelection from "@/simulation/generations/selection/InsideReproductionAreaSelection";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import GreatestDistanceSelection from "@/simulation/generations/selection/GreatestDistanceSelection"
import ContinuousSelection from "@/simulation/generations/selection/ContinuousSelection";

export const selectionMethodOptions: Option[] = [
  {value: "InsideReproductionAreaSelection", label: "Inside Reproduction Area"},
  {value: "GreatestDistanceSelection", label: "Greatest Distance"},
  {value: "ReproductionSelection", label: "Reproduction"},
  {value: "ContinuousSelection", label: "Continuous"},
];

export function selectSelectionMethod(value: string) : SelectionMethod {
  console.log("selectionMethodObjectList ", value);
  switch(value) {
    case "InsideReproductionAreaSelection":
      return new InsideReproductionAreaSelection();
      break;
      case "GreatestDistanceSelection":
        return new GreatestDistanceSelection();
        break;
      case "ReproductionSelection":
        return new ReproductionSelection();
        break;
      case "ContinuousSelection":
        return new ContinuousSelection();
        default:
      console.log("selectionMethodObjectList invalid value: ", value);
      return new InsideReproductionAreaSelection();
   }
}
