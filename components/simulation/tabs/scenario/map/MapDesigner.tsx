"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  mapDesignerFullscreenAtom,
  mapDesignerSelectedObjectIndexAtom,
} from "../../../store/mapDesignerAtoms";
import useWorldValue from "@/hooks/useWorldValue";
import MapDesignerHeader from "./MapDesignerHeader";
import MapDesignerFooter from "./MapDesignerFooter";
import MapDesignerCanvas from "./MapDesignerCanvas";
import ToggleableFullscreen from "@/components/global/ToggleableFullscreen";
import classNames from "classnames";

// Edits the map of the Scenario draft: changes are applied with Update simulation or Restart
export default function MapDesigner() {
  const isFullscreen = useAtomValue(mapDesignerFullscreenAtom);
  const setSelectedIndex = useSetAtom(mapDesignerSelectedObjectIndexAtom);
  const runningSimData = useWorldValue((world) => world.simData, null);

  // a loaded scenario, Update simulation or Restart replace the draft map: the index may point to another object
  useEffect(() => {
    setSelectedIndex(undefined);
  }, [runningSimData, setSelectedIndex]);

  return (
    <ToggleableFullscreen enable={isFullscreen} className="bg-grey-dark">
      <div
        className={classNames(
          isFullscreen && "section-container py-6 xl:px-36 2xl:px-60"
        )}
      >
        <div className="flex flex-col gap-5 ">
          <MapDesignerHeader />

          <div className="grid gap-5 lg:grid-cols-3">
            <MapDesignerCanvas />

            <MapDesignerFooter />
          </div>
        </div>
      </div>
    </ToggleableFullscreen>
  );
}
