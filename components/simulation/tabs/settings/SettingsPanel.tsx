"use client";

//import NumberInput from "@/components/global/inputs/NumberInput";
import {Dropdown, Option} from "../../../global/inputs/Dropdown"; 
import {selectionMethodOptions, selectSelectionMethod} from "./selectionMethodOptions";
import {populationStrategyOptions, selectPopulationStrategy} from "./populationStrategyOptions"
import PopulationStrategy from "@/simulation/generations/population/PopulationStrategy";
import SelectionMethod from "@/simulation/generations/selection/SelectionMethod";
import {
  worldControllerAtom,
  //restartCountAtom,
  worldGenerationDataAtom,
  worldControllerDataAtom,
} from "../../store";
import SelectInput from "@/components/global/inputs/SelectInput";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import {Sensor,SensorName} from "@/simulation/creature/brain/CreatureSensors";
import {Action, ActionName} from "@/simulation/creature/brain/CreatureActions";
//import useSyncAtomWithWorldProperty from "@/hooks/useSyncAtomWithWorldProperty";
import { ChangeEvent } from "react";
import * as constants from "@/simulation/simulationConstants"


const enabledSensorsAtom = atom(constants.RUN_ENABLED_SENSORS);
const enabledActionsAtom = atom(constants.RUN_ENABLED_ACTIONS);
const mutationModeAtom = atom(constants.RUN_MUTATION_MODE);



export default function SettingsPanel() {

  const worldController = useAtomValue(worldControllerAtom);
  const sensors = Object.values(worldController?.generations.sensors.data ?? {});
  const actions = Object.values(worldController?.generations.actions.data ?? {});
  const [enabledSensors, setEnabledSensors] = useAtom(enabledSensorsAtom);   
  const [enabledActions, setEnabledActions] = useAtom(enabledActionsAtom);   
  const [worldGenerationsData, setWorldGenerationData] = useAtom(worldGenerationDataAtom);
  const [worldControllerData, setWorldControllerData] = useAtom(worldControllerDataAtom);
    
  setEnabledSensors(worldGenerationsData.enabledSensors);
  setEnabledActions(worldGenerationsData.enabledActions);

  const handleSensorChange = (name: SensorName, checked: boolean) => {

    //const handleSensorChange = (name: SensorName, checked: ChangeEvent<HTMLInputElement>) => {
      if (checked) {
        setEnabledSensors([...enabledSensors, name]);
        setWorldGenerationData(prev => ({ ...prev, enabledSensors: [...enabledSensors, name] }));
      } else if (enabledSensors.length > 1) {
        setEnabledSensors(enabledSensors.filter((item) => item !== name));
        setWorldGenerationData(prev => ({ ...prev, enabledSensors: enabledSensors.filter((item) => item !== name) }));
      }
    };

                    

  const handleActionChange = (name: ActionName, checked: boolean) => {
    if (checked) {
      setEnabledActions([...enabledActions, name]);
      setWorldGenerationData(prev => ({ ...prev, enabledActions: [...enabledActions, name] }));
    } else if (enabledActions.length > 1) {
      setEnabledActions(enabledActions.filter((item) => item !== name));
      setWorldGenerationData(prev => ({ ...prev, enabledActions: enabledActions.filter((item) => item !== name) }));
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
        //const sp : SelectionMethod = selectSelectionMethod(value); 
        //setSelectionMethod(sp);
        setWorldGenerationData(prev => ({ ...prev, selectionMethod: selectSelectionMethod(value) }));
      }

      
      const handlePopulationStrategy = (value: string) => {
        //const ps : PopulationStrategy = selectPopulationStrategy(value); 
        //setPopulationStrategy(ps);
        setWorldGenerationData(prev => ({ ...prev, populationStrategy: selectPopulationStrategy(value) }));
      }
      

  
    const handleChangePopulation = (e: { target: { value: any; }; }) => {
      //const newValues = {... worldGenerationsData};
      //newValues.initialPopulation = e.target.value;
      //setWorldGenerationData(newValues)
      setWorldGenerationData(prevState => ({ ...prevState, initialPopulation: e.target.value }))
      setWorldControllerData(prevState => ({ ...prevState, initialPopulation: e.target.value }))
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

          {/*  size  */}
          <div className="flex flex-col">
            <label className="grow">WorldController Size</label>
            <input
                type="number"
                value={worldControllerData.size.toString()}
                onChange={(e) => {setWorldControllerData(prevState => ({ ...prevState, size: parseInt(e.target.value)}))}} 
                className="min-w-0 bg-grey-mid p-1"
              >
            </input>
          </div>
          {/*  initialPopulation  */}
          <div className="flex flex-col">
            <label className="grow">Initial population</label>
            <input
                type="number"
                value={worldGenerationsData.initialPopulation.toString()}
                onChange={handleChangePopulation}
                className="min-w-0 bg-grey-mid p-1"
              >
            </input>
          </div>
          {/*  stepsPerGen  */}
          <div className="flex flex-col">
            <label className="grow">Steps per generation</label>
            <input
                type="number"
                value={worldControllerData.stepsPerGen.toString()}
                onChange={(e) => {setWorldControllerData(prevState => ({ ...prevState, stepsPerGen: parseInt(e.target.value)}))}} 
                className="min-w-0 bg-grey-mid p-1"
              >
            </input>
          </div>
            </div>
          </div>
          <div>
          {/*  selectionMethod  */}
          <h3 className="mb-1 text-2xl font-bold">Sim options</h3>
            <div className="mb-1">
              <h2>Selection method: <br/>current: {worldController?.generations.selectionMethod.constructor.name} </h2>
              <Dropdown options={selectionMethodOptions} 
                        onSelect={handleSelectionMethodOptions}/>
              <br/>
          {/*  populationStrategy  */}
          <h2>Population strategy: <br/>current: {worldController?.generations.populationStrategy.constructor.name} </h2>
              <Dropdown options={populationStrategyOptions}
                        onSelect={handlePopulationStrategy} />
              <br/>
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-2xl font-bold">Neuronal Networks</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/*  initialGenomeSize  */}
              <div className="flex flex-col">
                <label className="grow">Initial genome size</label>
                <input
                    type="number"
                    value={worldGenerationsData.initialGenomeSize.toString()}
                    onChange={(e) => {setWorldGenerationData(prevState => ({ ...prevState, initialGenomeSize: parseInt(e.target.value)}))}} 
                    className="min-w-0 bg-grey-mid p-1"
                  >
                </input>
              </div>
            {/*  maxGenomeSize  */}
            <div className="flex flex-col">
                <label className="grow">Max genome size</label>
                <input
                    type="number"
                    value={worldGenerationsData.maxGenomeSize.toString()}
                    onChange={(e) => {setWorldGenerationData(prevState => ({ ...prevState, maxGenomeSize: parseInt(e.target.value)}))}} 
                    className="min-w-0 bg-grey-mid p-1"
                  >
                </input>
              </div>
            {/*  maxNumberNeurons  */}
            <div className="flex flex-col">
                <label className="grow">Max neurons</label>
                <input
                    type="number"
                    value={worldGenerationsData.maxNumberNeurons.toString()}
                    onChange={(e) => {setWorldGenerationData(prevState => ({ ...prevState, maxNumberNeurons: parseInt(e.target.value)}))}} 
                    className="min-w-0 bg-grey-mid p-1"
                  >
                </input>
              </div>
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
            {/*  mutationProbability  */}
            <div className="flex flex-col">
                <label className="grow">Mutation probability (0 - 1)</label>
                <input
                    type="number"
                    value={worldGenerationsData.mutationProbability.toString()}
                    onChange={(e) => {setWorldGenerationData(prevState => ({ ...prevState, mutationProbability: parseFloat(e.target.value)}))}} 
                    step="0.01"
                    className="min-w-0 bg-grey-mid p-1"
                  >
                </input>
              </div>
            {/*  geneInsertionDeletionProbability  */}
            <div className="flex flex-col">
                <label className="grow">Max neurons</label>
                <input
                    type="number"
                    value={worldGenerationsData.geneInsertionDeletionProbability.toString()}
                    onChange={(e) => {setWorldGenerationData(prevState => ({ ...prevState, geneInsertionDeletionProbability: parseFloat(e.target.value)}))}} 
                    step="0.001"
                    className="min-w-0 bg-grey-mid p-1"
                  >
                </input>
              </div>
            </div>
          </div>

            {/*  sensors  */}
            {/*   TODO to be deleted ---- I was trying to remove enabledSensors atom 
            <div>
              <h3 className="mb-1 text-2xl font-bold">Sensors</h3>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                    {sensors.map((sensor) => (
                    <><input
                        id={sensor.name}
                        key={sensor.name}
                        type="checkbox"
                        checked={enabledSensors.includes(sensor.name)}
                        onChange={(checked) => handleSensorChange(sensor.name, checked)}
                        className="inline-block h-4 w-4 min-w-0 shrink-0 bg-grey-mid p-2" /><label className="grow text-sm" htmlFor={sensor.name}>
                          {getSensorLabel(sensor)}
                        </label>
                      </>
                    ))}
              </div> 
              */}

          
          {/*  sensors  */}
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
          {/*  actions  */}
          <div>
            <h3 className="mb-1 text-2xl font-bold">Actions</h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {actions.map((actions) => (
                <CheckboxInput
                  id={actions.name}
                  key={actions.name}
                  label={getActionLabel(actions)}
                  checked={enabledActions.includes(actions.name)}
                  onChange={(checked) => handleActionChange(actions.name, checked)
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
}
