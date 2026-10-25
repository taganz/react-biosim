"use client";

import ScenariosSelection from "./ScenarioSelection";
import ScenarioSettings from "./ScenarioSettings";

export default function ScenarioPanel() {
  return (
    <div className="flex flex-col gap-8">
      <ScenariosSelection />
      <ScenarioSettings />
    </div>
  );
}
