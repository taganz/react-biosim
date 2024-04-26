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
scenarioObjects.push({name: "Carlos' original", filename: "Carlos' original.sim"});
scenarioObjects.push({name: "HET", filename: "sim HET generation 26.sim"});


