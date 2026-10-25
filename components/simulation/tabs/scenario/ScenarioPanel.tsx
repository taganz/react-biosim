"use client";

import Section from "../Section";
import ScenariosSelection from "./ScenarioSelection";
import LoadSimFile from "./LoadSimFile";
import SavedScenarioSelection from "./SavedScenarioSelection";
import ScenarioSettings from "./ScenarioSettings";

export default function ScenarioPanel() {
  return (
    <div className="flex flex-col gap-8">
      <Section title="Load scenario">
        <div className="flex flex-col gap-6">
          <ScenariosSelection />
          <LoadSimFile />
          <SavedScenarioSelection />
        </div>
      </Section>
      <ScenarioSettings />
    </div>
  );
}
