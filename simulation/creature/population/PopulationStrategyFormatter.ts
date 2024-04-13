import PopulationStrategy from "./PopulationStrategy";
import AsexualZonePopulation from "./AsexualZonePopulation";
import AsexualRandomPopulation from "./AsexualRandomPopulation";

export type SavedPopulationStrategy = string;

export const populationStrategyFormatter = {

  serialize: function (sm: PopulationStrategy ): SavedPopulationStrategy {
      return sm.name;
  }, 
  deserialize: function (parsed: string) : PopulationStrategy {
    switch(parsed) {
      case "AsexualZonePopulation":
        return new AsexualZonePopulation();
      case "AsexualRandomPopulation":
        return new AsexualRandomPopulation();
    }
    console.error("populationStrategyFormatter unknown PopulationStrategy. Defaulting to AsexualRandomPopulation");
    return new AsexualRandomPopulation; 
  }
};
