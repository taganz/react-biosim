import SelectionMethod from "./SelectionMethod";
import GreatestDistanceSelection from "./GreatestDistanceSelection";
import ReproductionSelection from "./ReproductionSelection";
import InsideReproductionAreaSelection from "./InsideReproductionAreaSelection";
import ContinuousSelection from "./ContinuousSelection";
import GreatestMassSelection from "./GreatestMassSelection";

export type SavedSelectionMethod = string;

export const selectionMethodFormatter = {

  serialize: function (sm: SelectionMethod ): SavedSelectionMethod {
      return sm.name;
  }, 
  deserialize: function (parsed: string) : SelectionMethod {
    switch(parsed) {
      case "ReproductionSelection":
        return new ReproductionSelection();
      case "InsideReproductionAreaSelection":
        return new InsideReproductionAreaSelection();
      case "GreatestDistanceSelection":
        return new GreatestDistanceSelection();
      case "GreatestMass":
        return new GreatestMassSelection();
      case "ContinuousSelection":
        return new ContinuousSelection();
          }
    console.error("selectionMethodFormatter unknown SelectionMethod: ", parsed, " Defaulting to InsideReproductionAreaSelection");
    return new InsideReproductionAreaSelection; 
  }
};
