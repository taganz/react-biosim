
export type ScenarioObjects = {
  name: string,
  filename: string,
  action : "startRun" | "resumeRun"
}

export const scenarioObjects : ScenarioObjects[] = [];

scenarioObjects.push({name: "Example 1", filename: "./video davidrmiller/Example 1.sim", action: "startRun"});
scenarioObjects.push({name: "Example 2", filename: "./video davidrmiller/Example 2_gen 37.sim", action: "startRun"});
scenarioObjects.push({name: "Example 2 with vertical bars", filename: "./video davidrmiller/Example 2_gen 67 with the vertical bars.sim", action: "startRun"});
scenarioObjects.push({name: "Example 4 (without kill)" , filename: "./video davidrmiller/Exemple 4 circle without kill.sim", action: "startRun"});
scenarioObjects.push({name: "Vertical boxes", filename: "vertical boxes.sim", action: "startRun"});
scenarioObjects.push({name: "Turn right", filename: "turn right.sim", action: "startRun"});
scenarioObjects.push({name: "Turn right generation 5574", filename: "turn right generation 5574.sim", action: "resumeRun"});
scenarioObjects.push({name: "Carlos' original", filename: "Carlos.sim", action: "startRun"});
scenarioObjects.push({name: "Plants and animals", filename: "sim W20 herbivores continuous.sim", action: "startRun"});
