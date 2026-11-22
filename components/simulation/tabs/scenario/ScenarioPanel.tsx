"use client";

import ScenarioSection from "./ScenarioSection";
import ScenariosSelection from "./ScenarioSelection";
import LoadSimFile from "./LoadSimFile";
import SavedScenarioSelection from "./SavedScenarioSelection";
import ScenarioSettings from "./ScenarioSettings";
import LoadedSpecies from "./LoadedSpecies";

export default function ScenarioPanel() {
  return (
    <div className="flex flex-col gap-4">
      <ScenarioSection id="load" title="Load scenario">
        <div className="flex flex-col gap-6">
          <ScenariosSelection />
          <LoadSimFile />
          <SavedScenarioSelection />
        </div>
      </ScenarioSection>
      <ScenarioSettings />
      <LoadedSpecies />
    </div>
  );
}
