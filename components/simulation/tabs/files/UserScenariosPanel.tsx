"use client";

import { useCallback, useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { saveAs } from "file-saver";
import Button from "@/components/global/Button";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import StatusMessage from "@/components/global/StatusMessage";
import useSimulationLoader, { LoadStatus } from "@/hooks/useSimulationLoader";
import { worldControllerAtom } from "../../store";
import {
  UserScenarioInfo,
  UserScenarioKind,
  deleteUserScenario,
  listUserScenarios,
  readUserScenario,
  renameUserScenario,
  saveUserScenario,
} from "@/helpers/userScenarios";
import {
  serializeGenerationStart,
  serializeSetup,
} from "@/simulation/serialization/formatters/simulationDataSerialization";

const kindLabel: Record<UserScenarioKind, string> = {
  setup: "Setup",
  generationStart: "Generation start",
};

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatSize(characters: number): string {
  return characters < 1024 * 1024
    ? `${Math.max(1, Math.round(characters / 1024))} KB`
    : `${(characters / 1024 / 1024).toFixed(1)} MB`;
}

export default function UserScenariosPanel() {
  const worldController = useAtomValue(worldControllerAtom);
  const [name, setName] = useState("");
  const [includeStats, setIncludeStats] = useState(false);
  const [scenarios, setScenarios] = useState<UserScenarioInfo[]>([]);
  const [status, setStatus] = useState<LoadStatus>({ state: "idle" });
  const { status: loadStatus, load } = useSimulationLoader();

  const refresh = useCallback(async () => {
    try {
      setScenarios(await listUserScenarios());
    } catch (error) {
      setStatus({ state: "error", message: `Could not read your scenarios: ${describeError(error)}` });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSave = async (kind: UserScenarioKind) => {
    if (!worldController) return;
    const generation = kind === "setup" ? 1 : worldController.currentGen;
    const scenarioName =
      name.trim() ||
      (kind === "setup"
        ? `sim ${worldController.simCode} setup`
        : `sim ${worldController.simCode} generation ${generation}`);
    const saved =
      kind === "setup" ? serializeSetup(worldController) : serializeGenerationStart(worldController, includeStats);

    try {
      await saveUserScenario(
        { name: scenarioName, kind, generation, simCode: worldController.simCode },
        JSON.stringify(saved)
      );
      setName("");
      setStatus({ state: "success", message: `Saved "${scenarioName}".` });
      refresh();
    } catch (error) {
      setStatus({ state: "error", message: `Could not save "${scenarioName}": ${describeError(error)}` });
    }
  };

  const handleLoad = (scenario: UserScenarioInfo) => {
    setStatus({ state: "idle" });
    // a generation start file is detected when it is loaded, and starts that generation
    load(() => readUserScenario(scenario.id), scenario.kind === "setup" ? "startRun" : "resumeRun", `"${scenario.name}"`);
  };

  const handleExport = async (scenario: UserScenarioInfo) => {
    try {
      const json = await readUserScenario(scenario.id);
      saveAs(new Blob([json], { type: "text/plain;charset=utf-8" }), `${scenario.name}.sim`);
    } catch (error) {
      setStatus({ state: "error", message: `Could not export "${scenario.name}": ${describeError(error)}` });
    }
  };

  const handleRename = async (scenario: UserScenarioInfo) => {
    const newName = window.prompt("New name", scenario.name)?.trim();
    if (!newName || newName === scenario.name) return;
    try {
      await renameUserScenario(scenario, newName);
      refresh();
    } catch (error) {
      setStatus({ state: "error", message: `Could not rename "${scenario.name}": ${describeError(error)}` });
    }
  };

  const handleDelete = async (scenario: UserScenarioInfo) => {
    if (!window.confirm(`Delete "${scenario.name}"? This cannot be undone.`)) return;
    try {
      await deleteUserScenario(scenario.id);
      setStatus({ state: "success", message: `Deleted "${scenario.name}".` });
      refresh();
    } catch (error) {
      setStatus({ state: "error", message: `Could not delete "${scenario.name}": ${describeError(error)}` });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p>
        Save the current simulation in this browser to load it later. <b>Setup</b> keeps the settings and the map,
        and starts again from generation 1. <b>Generation start</b> also keeps the genomes of the current generation,
        and starts that generation again.
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="user-scenario-name">Name (optional):</label>
        <input
          id="user-scenario-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="sim <code> generation <n>"
          className="bg-grey-mid p-1 text-sm"
        />
        <CheckboxInput
          id="user-scenario-include-stats"
          checked={includeStats}
          onChange={setIncludeStats}
          label="Include the stats history (larger for long runs)"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleSave("setup")} disabled={!worldController}>
            Save setup
          </Button>
          <Button onClick={() => handleSave("generationStart")} disabled={!worldController}>
            Save generation start
          </Button>
        </div>
      </div>

      <StatusMessage status={status} />
      <StatusMessage status={loadStatus} />

      {scenarios.length === 0 ? (
        <p className="text-sm">You have no saved scenarios in this browser yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {scenarios.map((scenario) => (
            <li key={scenario.id} className="flex flex-col gap-2 rounded-md border border-grey-mid p-2">
              <div>
                <p className="font-bold">{scenario.name}</p>
                <p className="text-sm">
                  {kindLabel[scenario.kind]}
                  {scenario.kind === "generationStart" && ` · generation ${scenario.generation}`}
                  {" · "}
                  {new Date(scenario.createdAt).toLocaleString()} · {formatSize(scenario.size)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => handleLoad(scenario)} disabled={loadStatus.state === "loading"}>
                  Load
                </Button>
                <Button onClick={() => handleExport(scenario)}>Export .sim</Button>
                <Button onClick={() => handleRename(scenario)}>Rename</Button>
                <Button variant="danger" onClick={() => handleDelete(scenario)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
