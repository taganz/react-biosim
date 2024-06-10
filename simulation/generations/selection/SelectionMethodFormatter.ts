import SelectionMethod from "./SelectionMethod";
import GreatestDistanceSelection from "./GreatestDistanceSelection";
import ReproductionSelection from "./ReproductionSelection";
import InsideReproductionAreaSelection from "./InsideReproductionAreaSelection";
import ContinuousSelection from "./ContinuousSelection";
import GreatestMassSelection from "./GreatestMassSelection";
import { selectionMap } from "./selectionMethodOptions";

export type SavedSelectionMethod = string;

export const selectionMethodFormatter = {

  serialize: function (sm: SelectionMethod ): SavedSelectionMethod {
      return sm.name;
  }, 
  deserialize: function(value: string): SelectionMethod {
    console.log("selectPopulationStrategy ", value);
    const strategyConstructor = selectionMap[value];
    if (strategyConstructor) {
      return strategyConstructor();
    } else {
      console.warn("selectionMethodFormatter invalid value: ", value);
      return new InsideReproductionAreaSelection(); // default case
    }
  }

};
