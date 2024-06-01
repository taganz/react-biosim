import PopulationStrategy from "./PopulationStrategy";
import AsexualZonePopulation from "./AsexualZonePopulation";
import AsexualRandomPopulation from "./AsexualRandomPopulation";
import RandomFixedGenePopulation from "./RandomFixedGenePopulation";
import ContinuousPopulation from "./ContinuousPopulation";
import PlantHerbivorePopulation from "./PlantHerbivorePopulation";

export type SavedPopulationStrategy = string;

export const populationStrategyFormatter = {

  serialize: function (sm: PopulationStrategy ): SavedPopulationStrategy {
      return sm.name;
  }, 
  
  deserialize: function (parsed: string) : PopulationStrategy {
    switch(parsed) {
      case "AsexualZonePopulation": return new AsexualZonePopulation();
      case "AsexualRandomPopulation": return new AsexualRandomPopulation();
      case "RandomFixedGenePopulation": return new RandomFixedGenePopulation();
      case "ContinuousPopulation":  return new ContinuousPopulation();
      case "PlantHerbivorePopulation":  return new PlantHerbivorePopulation();
      }
    console.error("populationStrategyFormatter unknown PopulationStrategy. Defaulting to AsexualRandomPopulation");
    return new AsexualRandomPopulation(); 
  }
  
};
