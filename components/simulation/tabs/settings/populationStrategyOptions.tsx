import {Option} from "../../../global/inputs/Dropdown";
import PopulationStrategy from "@/simulation/creature/population/PopulationStrategy";
import AsexualRandomPopulation from "@/simulation/creature/population/AsexualRandomPopulation";
import AsexualZonePopulation from "@/simulation/creature/population/AsexualZonePopulation";

export const populationStrategyOptions: Option[] = [
  {value: "1", label: "AsexualRandomPopulation"},
  {value: "2", label: "AsexualZonePopulation"},
];

export function selectPopulationStrategy(value: string) : PopulationStrategy {
  console.log("selectPopulationStrategy ", value);
  switch(value) {
    case "1":
      return new AsexualRandomPopulation();
      break;
    case "2":
      return new AsexualZonePopulation();
      break;
    default:
      console.log("onSelectPopulationStrategy invalid value: ", value);
      return new AsexualRandomPopulation();
   }
}