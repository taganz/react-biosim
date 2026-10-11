import {Option} from "../../../components/global/inputs/Dropdown";
import PopulationStrategy from "@/simulation/generations/population/PopulationStrategy";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import RandomFixedGenePopulation from "@/simulation/generations/population/RandomFixedGenePopulation";
import PlantHerbivorePopulation from "./PlantHerbivorePopulation";

export const populationStrategyOptions: Option[] = [
  {value: "AsexualRandomPopulation", label: "Asexual Random"},
  {value: "AsexualZonePopulation", label: "Asexual Zone"},
  {value: "RandomFixedGenePopulation", label: "Random Fixed Gene (in dev)"},
  {value: "PlantHerbivorePopulation", label: "PlantHerbivorePopulation (in dev)"},
];

// Mapping from values to constructor functions
export const populationMap: { [key: string]: () => PopulationStrategy } = {
  "AsexualRandomPopulation": () => new AsexualRandomPopulation(),
  "AsexualZonePopulation": () => new AsexualZonePopulation(),
  "RandomFixedGenePopulation": () => new RandomFixedGenePopulation(),
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