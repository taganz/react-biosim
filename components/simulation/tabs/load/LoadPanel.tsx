"use client";

import { ChangeEvent, useState } from "react";
import classNames from "classnames";
import Button from "@/components/global/Button";
import TextareaInput from "@/components/global/inputs/TextareaInput";
import StatusMessage from "@/components/global/StatusMessage";
import useSimulationLoader from "@/hooks/useSimulationLoader";

export default function LoadPanel() {
  const [pastedData, setPastedData] = useState("");
  const { status, load } = useSimulationLoader();
  const isLoading = status.state === "loading";

  const handleLoadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // reset the input so choosing the same file again triggers a new load
    e.target.value = "";
    if (!file) return;
    load(() => file.text(), "resumeRun", `"${file.name}"`);
  };

  const handleLoadPasted = () => {
    load(async () => pastedData, "resumeRun", "the pasted simulation");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="load-simulation-file">Load a .sim file saved with &quot;Save to file&quot;:</label>
        <input
          id="load-simulation-file"
          // the "choose file" button looks like a grey Button
          className={classNames(
            "text-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-grey-mid",
            "file:px-3 file:py-1 file:text-sm file:text-white hover:file:brightness-90",
            "lg:file:px-4 lg:file:py-2 lg:file:text-base disabled:opacity-50"
          )}
          type="file"
          accept=".sim,.txt,.json"
          disabled={isLoading}
          onChange={handleLoadFile}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="load-simulation-text">Or paste the JSON code of a saved simulation:</label>
        <TextareaInput
          id="load-simulation-text"
          value={pastedData}
          onChange={(e) => setPastedData(e.target.value)}
          minRows={2}
          maxRows={20}
        />
        <div>
          <Button onClick={handleLoadPasted} disabled={isLoading || pastedData.trim() === ""}>
            Load
          </Button>
        </div>
      </div>

      <StatusMessage status={status} />
    </div>
  );
}
