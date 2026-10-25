"use client";

import { ChangeEvent } from "react";
import classNames from "classnames";
import StatusMessage from "@/components/global/StatusMessage";
import useSimulationLoader from "@/hooks/useSimulationLoader";

export default function LoadSimFile() {
  const { status, load } = useSimulationLoader();

  const handleLoadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // reset the input so choosing the same file again triggers a new load
    e.target.value = "";
    if (!file) return;
    load(() => file.text(), "resumeRun", `"${file.name}"`);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="load-simulation-file">Load .sim file</label>
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
        disabled={status.state === "loading"}
        onChange={handleLoadFile}
      />
      <StatusMessage status={status} />
    </div>
  );
}
