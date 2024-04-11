"use client";

import NumberInput from "@/components/global/inputs/NumberInput";
import {Dropdown, Option} from "../../../global/inputs/Dropdown"; 
import {selectionMethodOptions, selectSelectionMethod} from "./selectionMethodOptions";
import {populationStrategyOptions, selectPopulationStrategy} from "./populationStrategyOptions"
import PopulationStrategy from "@/simulation/creature/population/PopulationStrategy";
import SelectionMethod from "@/simulation/creature/selection/SelectionMethod";
import {
  worldControllerAtom,
  enabledActionsAtom,
  enabledSensorsAtom,
  geneInsertionDeletionProbabilityAtom,
  initialGenomeSizeAtom,
  initialPopulationAtom,
  maxGenomeSizeAtom,
  maxNumberNeuronsAtom,
  mutationModeAtom,
  mutationProbabilityAtom,
  populationStrategyAtom,
  selectionMethodAtom,
  sizeAtom,
  stepsPerGenAtom,
  restartCountAtom
} from "../../store";
import SelectInput from "@/components/global/inputs/SelectInput";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {Sensor,SensorName} from "@/simulation/creature/sensors/CreatureSensors";
import {Action, ActionName} from "@/simulation/creature/actions/CreatureActions";
import useSyncAtomWithWorldProperty from "@/hooks/useSyncAtomWithWorldProperty";

export default function SettingsPanel() {

const worldController = useAtomValue(worldControllerAtom);
const sensors = Object.values(worldController?.sensors.data ?? {});
const actions = Object.values(worldController?.actions.data ?? {});
const [enabledSensors, setEnabledSensors] = useAtom(enabledSensorsAtom);
const [enabledActions, setEnabledActions] = useAtom(enabledActionsAtom);
const [populationStrategy, setPopulationStrategy] = useAtom(populationStrategyAtom);
const [selectionMethod, setSelectionMethod] = useAtom(selectionMethodAtom);
const restartCount = useAtom(restartCountAtom);
  useSyncAtomWithWorldProperty(
    enabledSensorsAtom,
    (worldController) => worldController.sensors.getList(),
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  );
  
  useSyncAtomWithWorldProperty(
    enabledActionsAtom,
    (worldController) => worldController.actions.getList(),
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  );

  const handleSensorChange = (name: SensorName, checked: boolean) => {
    if (checked) {
      setEnabledSensors([...enabledSensors, name]);
    } else if (enabledSensors.length > 1) {
      setEnabledSensors(enabledSensors.filter((item) => item !== name));
    }
  };

  const handleActionChange = (name: ActionName, checked: boolean) => {
    if (checked) {
      setEnabledActions([...enabledActions, name]);
    } else if (enabledActions.length > 1) {
      setEnabledActions(enabledActions.filter((item) => item !== name));
    }
  };

  const getPrettyName = (name: string) =>
    name.replace(/([A-Z])/g, " $1").trim();

  const getSensorLabel = (sensor: Sensor) =>
    `${getPrettyName(sensor.name)} (${sensor.neuronCount} ${
      sensor.neuronCount == 1 ? "neuron" : "neurons"
    })`;

  const getActionLabel = (action: Action) =>
    `${getPrettyName(action.name)} (1 neuron)`;
   


    const handleSelectionMethodOptions = (value: string) => {
      const sp : SelectionMethod = selectSelectionMethod(value); 
      console.log("handleSelectionMethodOptions ", value, sp);
      setSelectionMethod(sp);
    }

    const handlePopulationStrategy = (value: string) => {
      const sp : PopulationStrategy = selectPopulationStrategy(value); 
      setPopulationStrategy(sp);
    }
    
  return (
    <div>
      <p className="mb-2">
        You need to restart the simulation for these settings to work:
      </p>

      <div className="flex flex-col gap-8">
        <div>
          <h3 className="mb-1 text-2xl font-bold">WorldController</h3>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput atom={sizeAtom} label="WorldController Size" />
            <NumberInput atom={initialPopulationAtom} label="Initial population"/>
          <NumberInput atom={stepsPerGenAtom} label="Steps per generation" />
          </div>
        </div>

        <div>
          <h3 className="mb-1 text-2xl font-bold">Sim options</h3>
          <div className="mb-1">
            <h2>Selection method: <br/>current: {worldController?.selectionMethod.constructor.name} </h2>
            <Dropdown options={selectionMethodOptions} 
                      onSelect={handleSelectionMethodOptions}/>
            <br/>
            <h2>Population strategy: <br/>current: {worldController?.populationStrategy.constructor.name} </h2>
            <Dropdown options={populationStrategyOptions} onSelect={handlePopulationStrategy} />
            <br/>
          </div>
        </div>

        <div>
          <h3 className="mb-1 text-2xl font-bold">Neuronal Networks</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumberInput atom={initialGenomeSizeAtom} label="Initial genome size"/>
            <NumberInput atom={maxGenomeSizeAtom} label="Max genome size" />
            <NumberInput atom={maxNumberNeuronsAtom} label="Max neurons" />
          </div>
        </div>

        <div>
          <h3 className="mb-1 text-2xl font-bold">Mutations</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectInput atom={mutationModeAtom} label="Mutation mode">
              <option value="wholeGene">Whole Genes</option>
              <option value="singleBit">Single Bits</option>
              <option value="singleHexDigit">Single Hexadecimal Digits</option>
            </SelectInput>
            <NumberInput
              atom={mutationProbabilityAtom}
              label="Mutation probability (0 - 1)"
              step={0.001}
            />
            <NumberInput
              atom={geneInsertionDeletionProbabilityAtom}
              label="Gene insertion/deletion probability (0 - 1)"
              step={0.001}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-1 text-2xl font-bold">Sensors</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {sensors.map((sensor) => (
              <CheckboxInput
                id={sensor.name}
                key={sensor.name}
                label={getSensorLabel(sensor)}
                checked={enabledSensors.includes(sensor.name)}
                onChange={(checked) => handleSensorChange(sensor.name, checked)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-1 text-2xl font-bold">Actions</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {actions.map((actions) => (
              <CheckboxInput
                id={actions.name}
                key={actions.name}
                label={getActionLabel(actions)}
                checked={enabledActions.includes(actions.name)}
                onChange={(checked) =>
                  handleActionChange(actions.name, checked)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
