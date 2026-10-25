"use client";

import { useCallback, useEffect, useState } from "react";
import SelectInput from "@/components/global/inputs/SelectInput";
import StatusMessage from "@/components/global/StatusMessage";
import useSimulationLoader from "@/hooks/useSimulationLoader";
import { UserScenarioInfo, listUserScenarios, readUserScenario } from "@/helpers/userScenarios";

// Scenarios saved in this browser from the Export tab
export default function SavedScenarioSelection() {
  const [selectedId, setSelectedId] = useState("");
  const [scenarios, setScenarios] = useState<UserScenarioInfo[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const { status, load } = useSimulationLoader();

  const refresh = useCallback(() => {
    listUserScenarios().then(
      (list) => {
        setScenarios(list);
        setListError(null);
      },
      (error) => setListError(error instanceof Error ? error.message : String(error))
    );
  }, []);

  useEffect(refresh, [refresh]);

  const handleSelection = (value: string) => {
    setSelectedId(value);
    const scenario = scenarios.find((s) => s.id === value);
    if (!scenario) return;
    // a generation start file is detected when it is loaded, and starts that generation
    load(() => readUserScenario(scenario.id), scenario.kind === "setup" ? "startRun" : "resumeRun", `"${scenario.name}"`);
  };

  return (
    // the list can change in the Export tab, so it is read again when the combo gets the focus
    <div className="flex flex-col gap-2" onFocus={refresh}>
      <SelectInput label="Load saved scenario" value={selectedId} onChange={handleSelection}>
        <option value="">
          {scenarios.length === 0 ? "--No saved scenarios--" : "--Choose a saved scenario--"}
        </option>
        {scenarios.map((scenario) => (
          <option key={scenario.id} value={scenario.id}>
            {scenario.name}
            {scenario.kind === "generationStart" ? ` (generation ${scenario.generation})` : " (setup)"}
          </option>
        ))}
      </SelectInput>
      {listError && <StatusMessage status={{ state: "error", message: `Could not read your scenarios: ${listError}` }} />}
      <StatusMessage status={status} />
    </div>
  );
}
