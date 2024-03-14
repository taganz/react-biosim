"use client";

import NumberInput from "@/components/global/inputs/NumberInput";
import SelectInput from "@/components/global/inputs/SelectInput";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import { useAtom, useAtomValue } from "jotai";
import {
  Sensor,
  SensorName,
} from "@/simulation/creature/sensors/CreatureSensors";
import {
  Action,
  ActionName,
} from "@/simulation/creature/actions/CreatureActions";
import useSyncAtomWithWorldProperty from "@/hooks/useSyncAtomWithWorldProperty";

export default function StartPanel() {
 
  return (
    <div>
      <p className="mb-2">
        This is a simulation...:
      </p>

    </div>
  );
}
