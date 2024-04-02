import {Option} from "../../../global/inputs/Dropdown";
import SelectionMethod from "@/simulation/creature/selection/SelectionMethod";
import InsideReproductionAreaSelection from "@/simulation/creature/selection/InsideReproductionAreaSelection";
import ReproductionSelection from "@/simulation/creature/selection/ReproductionSelection";
import GreatestDistanceSelection from "@/simulation/creature/selection/GreatestDistanceSelection"

export const selectionMethodOptions: Option[] = [
  {value: "InsideReproductionAreaSelection", label: "Inside Reproduction Area"},
  {value: "GreatestDistanceSelection", label: "Greatest Distance"},
  {value: "ReproductionSelection", label: "Reproduction"},
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
        default:
      console.log("selectionMethodObjectList invalid value: ", value);
      return new InsideReproductionAreaSelection();
   }
}
