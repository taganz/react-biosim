import PopulationStrategy from "./PopulationStrategy";
import AsexualZonePopulation from "./AsexualZonePopulation";
import AsexualRandomPopulation from "./AsexualRandomPopulation";
import RandomFixedGenePopulation from "./RandomFixedGenePopulation";
import ContinuousPopulation from "./ContinuousPopulation";
import PlantHerbivorePopulation from "./PlantHerbivorePopulation";
import { populationMap } from "./populationStrategyOptions";

export type SavedPopulationStrategy = string;

export const populationStrategyFormatter = {

  serialize: function (sm: PopulationStrategy ): SavedPopulationStrategy {
      return sm.name;
  }, 
    
  deserialize: function(value: string): PopulationStrategy {
    console.log("selectPopulationStrategy ", value);
    const strategyConstructor = populationMap[value];
    if (strategyConstructor) {
      return strategyConstructor();
    } else {
      console.warn("onSelectPopulationStrategy invalid value: ", value);
      return new AsexualRandomPopulation(); // default case
    }
  }


};
