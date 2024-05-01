import {Option} from "../../../global/inputs/Dropdown";
import PopulationStrategy from "@/simulation/generations/population/PopulationStrategy";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import RandomFixedGenePopulation from "@/simulation/generations/population/RandomFixedGenePopulation";
import ContinuousPopulation from "@/simulation/generations/population/ContinuousPopulation";

export const populationStrategyOptions: Option[] = [
  {value: "1", label: "Asexual Random"},
  {value: "2", label: "Asexual Zone"},
  {value: "3", label: "Random Fixed Gene"},
  {value: "4", label: "Continuous"},
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
      case "3":
        return new RandomFixedGenePopulation();
        break;
      case "4":
        return new ContinuousPopulation();
        break;
      default:
      console.log("onSelectPopulationStrategy invalid value: ", value);
      return new AsexualRandomPopulation();
   }
}