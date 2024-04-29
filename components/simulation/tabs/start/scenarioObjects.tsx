import SavedWorldGenerationData from "@/simulation/serialization/data/SavedWorldGenerationData";
import SavedWorldControllerData from "@/simulation/serialization/data/SavedWorldControllerData";
import SavedWorld from '@/simulation/serialization/data/SavedWorld';


// TODO implement missing objects - Health


export type ScenarioObjects = {
  name: string,
  filename: string
}



export const scenarioObjects : ScenarioObjects[] = [];

scenarioObjects.push({name: "vertical boxes", filename: "vertical boxes.sim"});
scenarioObjects.push({name: "turn right", filename: "turn right.sim"});
scenarioObjects.push({name: "Carlos' original", filename: "Carlos.sim"});
scenarioObjects.push({name: "HET", filename: "sim HET generation 26.sim"});
scenarioObjects.push({name: "debug", filename: "sim H8U generation 176_small_for_test.sim"});
scenarioObjects.push({name: "test herbivores", filename: "sim W19 generation 16_herbivores.sim"});

