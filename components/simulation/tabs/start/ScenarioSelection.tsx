import React, { useState } from "react";
import SelectInput from "@/components/global/inputs/SelectInput";
import StatusMessage from "@/components/global/StatusMessage";
import useSimulationLoader from "@/hooks/useSimulationLoader";
import { scenarioObjects } from "./scenarioObjects";

export default function ScenariosSelection() {
  const [selectedIndex, setSelectedIndex] = useState("");
  const { status, load } = useSimulationLoader();

  const handleSelection = (value: string) => {
    setSelectedIndex(value);
    if (value === "") return;

    const scenario = scenarioObjects[parseInt(value)];
    load(
      async () => {
        const response = await fetch(scenario.filename);
        if (!response.ok) {
          throw new Error(`the scenario file was not found (HTTP ${response.status}).`);
        }
        return response.text();
      },
      scenario.action,
      `"${scenario.name}"`
    );
  };

  return (
    <div className="my-4 flex flex-col gap-2">
      <SelectInput label="Scenario" value={selectedIndex} onChange={handleSelection}>
        <option value="">--Choose a scenario--</option>
        {scenarioObjects.map((scenario, index) => (
          <option key={scenario.filename} value={index.toString()}>
            {scenario.name}
          </option>
        ))}
      </SelectInput>
      <StatusMessage status={status} />
    </div>
  );
}
