"use client";

import Button from "@/components/global/Button";
import { worldAtom } from "../../store";
import { useAtomValue } from "jotai";
import CopyToClipboardTextarea from "@/components/global/inputs/CopyToClipboardTextarea";
import { useState } from "react";
import { saveWorld } from "@/simulation/serialization/saveWorld";
import { saveAs } from "file-saver";

export default function SavePanel() {
  const world = useAtomValue(worldAtom);
  const [data, setData] = useState("");

  const handleSave = () => {
    if (world) {
      const savedWorld = saveWorld(world);
      const json = JSON.stringify(savedWorld);
      setData(json);
    }
  };

  const handleSaveToFile = () => {
    if (world) {
      const savedWorld = saveWorld(world);
      const json = JSON.stringify(savedWorld);
      setData(json);

      const blob = new Blob ([json]  , { type: 'text/plain;charset=utf-8'})
      saveAs( blob, 'sim_generation '.concat(world.currentGen.toString()) ); 
    }
  };

  return (
    <div>
      <p className="mb-2">
        Press the &quot;Save&quot; button below to generate a JSON code of world
        that you can back up somewhere else! If you want to load it, use the
        &quot;Load&quot; tab.
      </p>

      <CopyToClipboardTextarea
        value={data}
        maxRows={20}
        minRows={20}
        withScrollbar
      />
      {/*div className="mt-2 text-center">*/}
      <div  className="mt-2">
        <Button onClick={handleSave}>Save</Button>
        <br/>
        <br/><p>Beta:</p><br/>
        <Button onClick={handleSaveToFile}>Save to file</Button>
      </div>
    </div>
  );
}
