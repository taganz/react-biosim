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

// Mapping from values to constructor functions
export const populationMap: { [key: string]: () => PopulationStrategy } = {
  "AsexualRandomPopulation": () => new AsexualRandomPopulation(),
  "AsexualZonePopulation": () => new AsexualZonePopulation(),
  "RandomFixedGenePopulation": () => new RandomFixedGenePopulation(),
  "ContinuousPopulation": () => new ContinuousPopulation(),
  "PlantHerbivorePopulation": () => new PlantHerbivorePopulation(),
};



export function selectPopulationStrategy(value: string): PopulationStrategy {
  const strategyConstructor = populationMap[value];
  if (strategyConstructor) {
    return strategyConstructor();
  } else {
    console.warn("onSelectPopulationStrategy invalid value: ", value);
    return new AsexualRandomPopulation(); // default case
  }
}