"use client";

//import NumberInput from "@/components/global/inputs/NumberInput";
import {Dropdown, Option} from "../../../global/inputs/Dropdown"; 
import {selectionMethodOptions, selectSelectionMethod} from "../../../../simulation/generations/selection/selectionMethodOptions";
import {populationStrategyOptions, selectPopulationStrategy} from "../../../../simulation/generations/population/populationStrategyOptions"
import {
  worldControllerAtom,
  //restartCountAtom,
  //worldGenerationDataAtom,
  //worldControllerDataAtom,
  simulationDataAtom,
  //waterDataAtom,
} from "../../store";
import SelectInput from "@/components/global/inputs/SelectInput";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import {Sensor,SensorName} from "@/simulation/creature/brain/CreatureSensors";
import {Action, ActionName} from "@/simulation/creature/brain/CreatureActions";
//import useSyncAtomWithWorldProperty from "@/hooks/useSyncAtomWithWorldProperty";
import { ChangeEvent } from "react";
import * as constants from "@/simulation/simulationDataDefault"

import UpdateParametersButton from "../../UpdateParametersButton";
import { RainType, rainTypeOptions } from "@/simulation/water/RainType";
import { SimulationData } from "@/simulation/SimulationData";

const enabledSensorsAtom = atom(constants.WORLD_GENERATIONS_DATA_DEFAULT.enabledSensors);
const enabledActionsAtom = atom(constants.WORLD_GENERATIONS_DATA_DEFAULT.enabledActions);
const mutationModeAtom = atom(constants.WORLD_GENERATIONS_DATA_DEFAULT.mutationMode);


// This should update only
//  - worldControllerDataAtom 
//  - worldGenerationDataAtom

export default function SettingsPanel() {

  const worldController = useAtomValue(worldControllerAtom);
  const sensors = Object.values(worldController?.generations.sensors.data ?? {});
  const actions = Object.values(worldController?.generations.actions.data ?? {});
  const [enabledSensors, setEnabledSensors] = useAtom(enabledSensorsAtom);   
  const [enabledActions, setEnabledActions] = useAtom(enabledActionsAtom);   
  //const [worldGenerationsData, setWorldGenerationData] = useAtom(worldGenerationDataAtom);
  //const [worldControllerData, setWorldControllerData] = useAtom(worldControllerDataAtom);
  //const [waterData, setWaterData] = useAtom(waterDataAtom);
  const [simulationData, setSimulationData] = useAtom(simulationDataAtom);
    
  setEnabledSensors(simulationData.worldGenerationsData.enabledSensors);
  setEnabledActions(simulationData.worldGenerationsData.enabledActions);

  const handleSensorChange = (name: SensorName, checked: boolean) => {

    //const handleSensorChange = (name: SensorName, checked: ChangeEvent<HTMLInputElement>) => {
      if (checked) {
        setEnabledSensors([...enabledSensors, name]);
        setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
          enabledSensors: [...enabledSensors, name]}}));
      } else if (enabledSensors.length > 1) {
        setEnabledSensors(enabledSensors.filter((item) => item !== name));
        setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
          enabledSensors: enabledSensors.filter((item) => item !== name)}}));
      }
    };

                    

  const handleActionChange = (name: ActionName, checked: boolean) => {
    if (checked) {
      setEnabledActions([...enabledActions, name]);
      setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
        enabledActions: [...enabledActions, name]}}));
  } else if (enabledActions.length > 1) {
      setEnabledActions(enabledActions.filter((item) => item !== name));
      setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
        enabledActions: enabledActions.filter((item) => item !== name)}}));
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
        setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
          selectionMethod: selectSelectionMethod(value)}}));
      }

      const handleRainTypeOptions = (value: string) => {
        setSimulationData(prev => ({...prev,waterData: {...prev.waterData,
          rainType: value as RainType}}));
      }
    
      const handlePopulationStrategy = (value: string) => {
        setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
          populationStrategy: selectPopulationStrategy(value)}}));
      }

        
    const handleChangePopulation = (e: { target: { value: any; }; }) => {
      setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
        initialPopulation: e.target.value}}));
    //setWorldControllerData(prevState => ({ ...prevState, initialPopulation: e.target.value }))
    }

    
    const handleSize = (e: { target: { value: any; }; }) => {
      setSimulationData(prev => ({...prev,worldControllerData: {...prev.worldControllerData,
           size: parseInt(e.target.value),}}))};


    //TODO - select combo
    //const handlePhenotypeColorMode = (e: { target: { value: any; }; }) => {
    //  setWorldGenerationData(prevState => ({ ...prevState, phenotypeColorMode: e.target.value }))
    //}
  
    return (
      <div>
        <p className="mb-2">
          You can restart the simulation for these settings to work or you can update current simulation:
        </p>
        <UpdateParametersButton/>
        <br/>


        <div className="flex flex-col gap-8">

    {/*  === WORLD CONTROLLER === */}

          <div>
            <h3 className="mb-1 text-2xl font-bold">WorldController</h3>
            <p>Simulation code: {simulationData.worldControllerData.simCode}</p>
            <p>Phenotype mode: {simulationData.worldGenerationsData.phenotypeColorMode}</p>
            <div className="grid grid-cols-2 gap-4">

    {/*  size  */}

            <div className="flex flex-col">
              <label className="grow">WorldController Size</label>
              <input
                  type="number"
                  value={simulationData.worldControllerData.size.toString()}
                  onChange={(e) => {setSimulationData(prev => ({...prev,worldControllerData: {...prev.worldControllerData,
                                  size: parseInt(e.target.value),}}))}}
                  className="min-w-0 bg-grey-mid p-1"
                >
              </input>
            </div>

            {/*  initialPopulation  */}

            <div className="flex flex-col">
              <label className="grow">Initial population</label>
              <input
                  type="number"
                  value={simulationData.worldGenerationsData.initialPopulation.toString()}
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
                  value={simulationData.worldControllerData.stepsPerGen.toString()}
                  onChange={(e) => {setSimulationData(prev => ({...prev,worldControllerData: {...prev.worldControllerData,
                    stepsPerGen: parseInt(e.target.value),}}))}}
                  className="min-w-0 bg-grey-mid p-1"
                >
              </input>
            </div>
      </div>

    {/*  === GENERATIONS === */}

        <div>
        <br/>
          <h3 className="mb-1 text-2xl font-bold">Generations</h3>
          <p  className="mb-2">Metabolism is {simulationData.worldGenerationsData.metabolismEnabled ? "enabled" : "Not enabled"}</p>

    {/*  populationStrategy  */}

    <div>
        <br/>
          <p  className="mb-2">Population strategy: {worldController?.generations.populationStrategy.constructor.name} </p>
              <Dropdown options={populationStrategyOptions}
                        onSelect={handlePopulationStrategy} />
            </div>
          </div>

    {/*  selectionMethod  */}

            <div className="mb-1">
              <p  className="mb-2">Selection method:  {worldController?.generations.selectionMethod.constructor.name} </p>
              <Dropdown options={selectionMethodOptions} 
                        onSelect={handleSelectionMethodOptions}/>
              <br/>
            </div>

    {/*  === NEURONAL NETWORKS === */}

        <div>
            <h3 className="mb-1 text-2xl font-bold">Neuronal Networks</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

    {/*  initialGenomeSize  */}

              <div className="flex flex-col">
                <label className="grow">Initial genome size</label>
                <input
                    type="number"
                    value={simulationData.worldGenerationsData.initialGenomeSize.toString()}
                    onChange={(e) => {setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
                      initialGenomeSize: parseInt(e.target.value),}}))}}   
                    className="min-w-0 bg-grey-mid p-1"
                  >
                </input>
              </div>

    {/*  maxGenomeSize  */}

            <div className="flex flex-col">
                <label className="grow">Max genome size</label>
                <input
                    type="number"
                    value={simulationData.worldGenerationsData.maxGenomeSize.toString()}
                    onChange={(e) => {setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
                      maxGenomeSize: parseInt(e.target.value),}}))}}   
                    className="min-w-0 bg-grey-mid p-1"
                  >
                </input>
              </div>

    {/*  maxNumberNeurons  */}

            <div className="flex flex-col">
                <label className="grow">Max neurons</label>
                <input
                    type="number"
                    value={simulationData.worldGenerationsData.maxNumberNeurons.toString()}
                    onChange={(e) => {setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
                      maxNumberNeurons: parseInt(e.target.value),}}))}}   
                    className="min-w-0 bg-grey-mid p-1"
                  >
                </input>
              </div>
            </div>
          </div>

    {/*  === Mutations ===  */}

          <div>
          <br/>
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
                    value={simulationData.worldGenerationsData.mutationProbability.toString()}
                    onChange={(e) => {setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
                      mutationProbability: parseFloat(e.target.value),}}))}}   
                    step="0.01"
                    className="min-w-0 bg-grey-mid p-1"
                  >
                </input>
              </div>
    
    {/*  geneInsertionDeletionProbability  */}

            <div className="flex flex-col">
                <label className="grow">Insertion/Deletion probability (0 - 1)</label>
                <input
                    type="number"
                    value={simulationData.worldGenerationsData.geneInsertionDeletionProbability.toString()}
                    onChange={(e) => {setSimulationData(prev => ({...prev,worldGenerationsData: {...prev.worldGenerationsData,
                      geneInsertionDeletionProbability: parseFloat(e.target.value),}}))}}   
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
            <br/>
            <h3 className="mb-1 text-2xl font-bold">Sensors</h3>
            <p>Pain, mass, prey, predator sensors under development</p><br/>
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
            <br/>
            <h3 className="mb-1 text-2xl font-bold">Actions</h3>
            <p>Photysynthesis, reproduction and attack actions under development</p><br/>
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

      <div>
        
    {/*  === IN DEV OPTIONS === */}

            <h3 className="mb-1 text-2xl font-bold">Under development options</h3>
            <div className="grid grid-cols-2 gap-4">

         {/*  water cell capacity   */}

          <div className="flex flex-col">
            <label className="grow">Cell water capacity</label>
            <input
                type="number"
                value={simulationData.waterData.waterCellCapacity.toString()}
                onChange={(e) => {setSimulationData(prev => ({...prev,waterData: {...prev.waterData,
                  waterCellCapacity: parseFloat(e.target.value),}}))}}
              step="0.1"
                className="min-w-0 bg-grey-mid p-1"
              >
            </input>
          </div>

        {/*  water total per cell  */}

           <div className="flex flex-col">
            <label className="grow">Total water (per cell)</label>
            <input
                type="number"
                value={simulationData.waterData.waterTotalPerCell.toString()}
                onChange={(e) => {setSimulationData(prev => ({...prev,waterData: {...prev.waterData,
                  waterTotalPerCell: parseFloat(e.target.value),}}))}}
                step="0.1"
                className="min-w-0 bg-grey-mid p-1"
              >
            </input>
          </div>
          
          {/*  rain max  */}

          <div className="flex flex-col">
            <label className="grow">Rain max per cell</label>
            <input
                type="number"
                value={simulationData.waterData.waterRainMaxPerCell.toString()}
                onChange={(e) => {setSimulationData(prev => ({...prev,waterData: {...prev.waterData,
                  waterRainMaxPerCell: parseFloat(e.target.value),}}))}}                
                step="0.1"
                className="min-w-0 bg-grey-mid p-1"
              >
            </input>
          </div>

          {/*  first rain per cell  */}

          <div className="flex flex-col">
            <label className="grow">Initial water per cell</label>
            <input
                type="number"
                value={simulationData.waterData.waterFirstRainPerCell.toString()}
                onChange={(e) => {setSimulationData(prev => ({...prev,waterData: {...prev.waterData,
                  waterFirstRainPerCell: parseFloat(e.target.value),}}))}}     
                step="0.1"
                className="min-w-0 bg-grey-mid p-1"
              >
            </input>
          </div>

          {/*  evaporation  */}

          <div className="flex flex-col">
            <label className="grow">Evaporation</label>
            <input
                type="number"
                value={simulationData.waterData.waterEvaporationPerCellPerGeneration.toString()}
                onChange={(e) => {setSimulationData(prev => ({...prev,waterData: {...prev.waterData,
                  waterEvaporationPerCellPerGeneration: parseFloat(e.target.value),}}))}}   
                step="0.1"
                className="min-w-0 bg-grey-mid p-1"
              >
            </input>
          </div>

          </div>

           {/*  rainType  */}
          <br/>
          <div className="flex flex-col">
            <label  className="grow">Rain type: {simulationData.waterData.rainType} </label>
            <Dropdown options={rainTypeOptions} 
                      onSelect={handleRainTypeOptions} />
              <br/>
            </div>

          </div>

      </div>


      </div>
    );
}
