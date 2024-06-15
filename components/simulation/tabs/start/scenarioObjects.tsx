
export type ScenarioObjects = {
  name: string,
  filename: string,
  // startRun: start simulation from generation 1, resumeRun: continue from saved generation
  action : "startRun" | "resumeRun"
}


export const scenarioObjects : ScenarioObjects[] = [];

scenarioObjects.push({name: "davidrmiller example 1", filename: "./video davidrmiller/Example 1.sim", action: "startRun"});
scenarioObjects.push({name: "davidrmiller example 2", filename: "./video davidrmiller/Example 2_gen 37.sim", action: "startRun"});
scenarioObjects.push({name: "davidrmiller example 2 with vertical bars", filename: "./video davidrmiller/Example 2 with the vertical bars.sim", action: "startRun"});
scenarioObjects.push({name: "davidrmiller example 4 (without kill)" , filename: "./video davidrmiller/Exemple 4 circle without kill.sim", 
  action: "startRun"});
scenarioObjects.push({name: "davidrmiller example 4 generation 2600" , filename: "./video davidrmiller/Example 4 circle generation 2600.sim", 
  action: "resumeRun"});
scenarioObjects.push({name: "Vertical boxes", filename: "vertical boxes.sim", action: "startRun"});
scenarioObjects.push({name: "Turn right", filename: "turn right.sim", action: "startRun"});
scenarioObjects.push({name: "Turn right generation 5574", filename: "turn right generation 5574.sim", 
  action: "resumeRun"});
scenarioObjects.push({name: "Carlos' original", filename: "carlos.sim", action: "startRun"});
//scenarioObjects.push({name: "Plants", filename: "plants_2024_05_19.sim", action: "startRun"});
//scenarioObjects.push({name: "test", filename: "test.sim", action: "resumeRun"});
