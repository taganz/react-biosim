import {Option} from "../../../components/global/inputs/Dropdown";
import PopulationStrategy from "@/simulation/generations/population/PopulationStrategy";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import RandomFixedGenePopulation from "@/simulation/generations/population/RandomFixedGenePopulation";
import ContinuousPopulation from "@/simulation/generations/population/ContinuousPopulation";
import PlantHerbivorePopulation from "./PlantHerbivorePopulation";

export const populationStrategyOptions: Option[] = [
  {value: "1", label: "Asexual Random"},
  {value: "2", label: "Asexual Zone"},
  {value: "3", label: "Random Fixed Gene"},
  {value: "4", label: "Continuous"},
  {value: "5", label: "PlantHerbivorePopulation"},
];

export function selectPopulationStrategy(value: string) : PopulationStrategy {
  console.log("selectPopulationStrategy ", value);
  switch(value) {
    case "1": return new AsexualRandomPopulation();
    case "2": return new AsexualZonePopulation();
    case "3": return new RandomFixedGenePopulation();
    case "4": return new ContinuousPopulation();
    case "5": return new PlantHerbivorePopulation();
    default:
      console.warn("onSelectPopulationStrategy invalid value: ", value);
      return new AsexualRandomPopulation();
   }
}