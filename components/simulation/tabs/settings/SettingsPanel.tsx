"use client";

import { ReactNode } from "react";
import { useAtom, useAtomValue } from "jotai";
import classNames from "classnames";
import { selectionMethodOptions, selectSelectionMethod } from "@/simulation/generations/selection/selectionMethodOptions";
import { populationStrategyOptions, selectPopulationStrategy } from "@/simulation/generations/population/populationStrategyOptions";
import { worldControllerAtom, simulationDataAtom } from "../../store";
import NumberInput from "@/components/global/inputs/NumberInput";
import SelectInput from "@/components/global/inputs/SelectInput";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import Button from "@/components/global/Button";
import { Sensor, SensorName } from "@/simulation/creature/brain/CreatureSensors";
import { Action, ActionName } from "@/simulation/creature/brain/CreatureActions";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import { RainType, rainTypeOptions } from "@/simulation/water/RainType";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
import { WaterData } from "@/simulation/water/WaterData";
import UpdateParametersButton from "../../UpdateParametersButton";
import RestartButton from "../../RestartButton";
import useWorldValue from "@/hooks/useWorldValue";

const getPrettyName = (name: string) => name.replace(/([A-Z])/g, " $1").trim();

const getSensorLabel = (sensor: Sensor) =>
  `${getPrettyName(sensor.name)} (${sensor.neuronCount} ${
    sensor.neuronCount == 1 ? "neuron" : "neurons"
  })`;

const getActionLabel = (action: Action) => `${getPrettyName(action.name)} (1 neuron)`;

function Section({ title, description, children }: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">{title}</h3>
      {description && <p className="text-sm">{description}</p>}
      {children}
    </section>
  );
}

const FIELDS_GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

// Edits a draft (simulationDataAtom). The running simulation keeps its own
// simulationData until the draft is applied with "Update simulation" or "Restart".
export default function SettingsPanel() {
  const worldController = useAtomValue(worldControllerAtom);
  const [simulationData, setSimulationData] = useAtom(simulationDataAtom);
  const appliedSimulationData = useWorldValue((world) => world.simData, null);
  const hasPendingChanges =
    appliedSimulationData !== null && appliedSimulationData !== simulationData;

  const { worldControllerData, worldGenerationsData, waterData } = simulationData;
  const { enabledSensors, enabledActions } = worldGenerationsData;
  const sensors = Object.values(worldController?.generations.sensors.data ?? {});
  const actions = Object.values(worldController?.generations.actions.data ?? {});

  const setWorldValue = <K extends keyof WorldControllerData>(key: K, value: WorldControllerData[K]) =>
    setSimulationData((prev) => ({
      ...prev,
      worldControllerData: { ...prev.worldControllerData, [key]: value },
    }));

  const setGenerationsValue = <K extends keyof WorldGenerationsData>(key: K, value: WorldGenerationsData[K]) =>
    setSimulationData((prev) => ({
      ...prev,
      worldGenerationsData: { ...prev.worldGenerationsData, [key]: value },
    }));

  const setWaterValue = <K extends keyof WaterData>(key: K, value: WaterData[K]) =>
    setSimulationData((prev) => ({
      ...prev,
      waterData: { ...prev.waterData, [key]: value },
    }));

  // at least one sensor and one action must stay enabled
  const handleSensorChange = (name: SensorName, checked: boolean) => {
    if (checked) {
      setGenerationsValue("enabledSensors", [...enabledSensors, name]);
    } else if (enabledSensors.length > 1) {
      setGenerationsValue("enabledSensors", enabledSensors.filter((item) => item !== name));
    }
  };

  const handleActionChange = (name: ActionName, checked: boolean) => {
    if (checked) {
      setGenerationsValue("enabledActions", [...enabledActions, name]);
    } else if (enabledActions.length > 1) {
      setGenerationsValue("enabledActions", enabledActions.filter((item) => item !== name));
    }
  };

  const handleDiscard = () => {
    if (appliedSimulationData) setSimulationData(appliedSimulationData);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* === APPLY CHANGES === */}
      <div
        className={classNames(
          "sticky top-0 z-10 flex flex-col gap-2 rounded-md p-3",
          hasPendingChanges ? "bg-grey-mid" : "border border-grey-mid bg-grey-dark"
        )}
      >
        <p className="font-bold">
          {hasPendingChanges
            ? "You have changes that are not applied yet."
            : "These settings match the running simulation."}
        </p>
        {hasPendingChanges && (
          <div className="flex flex-wrap gap-2">
            <UpdateParametersButton />
            <RestartButton />
            <Button variant="dark" onClick={handleDiscard}>
              Discard changes
            </Button>
          </div>
        )}
        <p className="text-xs">
          &quot;Update simulation&quot; applies the changes and keeps the current creatures.
          &quot;Restart&quot; starts again from generation 1.
        </p>
      </div>

      {/* === WORLD === */}
      <Section title="World">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
          <dt>Simulation code</dt>
          <dd>{worldControllerData.simCode}</dd>
          <dt>Phenotype mode</dt>
          <dd>{worldGenerationsData.phenotypeColorMode}</dd>
          <dt>Metabolism</dt>
          <dd>{worldGenerationsData.metabolismEnabled ? "enabled" : "not enabled"}</dd>
        </dl>
        <div className={FIELDS_GRID}>
          <NumberInput
            label="World size"
            value={worldControllerData.size}
            onChange={(value) => setWorldValue("size", value)}
            integer
            min={10}
            max={1000}
          />
          <NumberInput
            label="Initial population"
            value={worldGenerationsData.initialPopulation}
            onChange={(value) => setGenerationsValue("initialPopulation", value)}
            integer
            min={1}
            // every creature needs its own cell
            max={worldControllerData.size * worldControllerData.size}
          />
          <NumberInput
            label="Steps per generation"
            value={worldControllerData.stepsPerGen}
            onChange={(value) => setWorldValue("stepsPerGen", value)}
            integer
            min={1}
          />
        </div>
      </Section>

      {/* === GENERATIONS === */}
      <Section title="Generations">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectInput
            label="Population strategy"
            value={worldGenerationsData.populationStrategy.name}
            onChange={(value: string) =>
              setGenerationsValue("populationStrategy", selectPopulationStrategy(value))
            }
          >
            {populationStrategyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            label="Selection method"
            value={worldGenerationsData.selectionMethod.name}
            onChange={(value: string) =>
              setGenerationsValue("selectionMethod", selectSelectionMethod(value))
            }
          >
            {selectionMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </div>
      </Section>

      {/* === NEURONAL NETWORKS === */}
      <Section title="Neuronal networks">
        <div className={FIELDS_GRID}>
          <NumberInput
            label="Initial genome size"
            value={worldGenerationsData.initialGenomeSize}
            onChange={(value) => setGenerationsValue("initialGenomeSize", value)}
            integer
            min={1}
            max={worldGenerationsData.maxGenomeSize}
          />
          <NumberInput
            label="Max genome size"
            value={worldGenerationsData.maxGenomeSize}
            onChange={(value) => setGenerationsValue("maxGenomeSize", value)}
            integer
            min={worldGenerationsData.initialGenomeSize}
          />
          <NumberInput
            label="Max neurons"
            value={worldGenerationsData.maxNumberNeurons}
            onChange={(value) => setGenerationsValue("maxNumberNeurons", value)}
            integer
            min={1}
          />
        </div>
      </Section>

      {/* === MUTATIONS === */}
      <Section title="Mutations">
        <div className={FIELDS_GRID}>
          <SelectInput
            label="Mutation mode"
            value={worldGenerationsData.mutationMode}
            onChange={(value: string) => setGenerationsValue("mutationMode", value as MutationMode)}
          >
            <option value="wholeGene">Whole Genes</option>
            <option value="singleBit">Single Bits</option>
            <option value="singleHexDigit">Single Hexadecimal Digits</option>
          </SelectInput>
          <NumberInput
            label="Mutation probability (0 - 1)"
            value={worldGenerationsData.mutationProbability}
            onChange={(value) => setGenerationsValue("mutationProbability", value)}
            step={0.01}
            min={0}
            max={1}
          />
          <NumberInput
            label="Insertion/Deletion probability (0 - 1)"
            value={worldGenerationsData.geneInsertionDeletionProbability}
            onChange={(value) => setGenerationsValue("geneInsertionDeletionProbability", value)}
            step={0.001}
            min={0}
            max={1}
          />
        </div>
      </Section>

      {/* === SENSORS === */}
      <Section
        title="Sensors"
        description="At least one sensor must stay enabled. Pain, mass, prey and predator sensors are under development."
      >
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
      </Section>

      {/* === ACTIONS === */}
      <Section
        title="Actions"
        description="At least one action must stay enabled. Photosynthesis, reproduction and attack actions are under development."
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {actions.map((action) => (
            <CheckboxInput
              id={action.name}
              key={action.name}
              label={getActionLabel(action)}
              checked={enabledActions.includes(action.name)}
              onChange={(checked) => handleActionChange(action.name, checked)}
            />
          ))}
        </div>
      </Section>

      {/* === IN DEV OPTIONS === */}
      <details className="flex flex-col gap-3">
        <summary className="cursor-pointer text-2xl font-bold">
          Under development: water
        </summary>
        <div className={classNames(FIELDS_GRID, "mt-3")}>
          <NumberInput
            label="Cell water capacity"
            value={waterData.waterCellCapacity}
            onChange={(value) => setWaterValue("waterCellCapacity", value)}
            step={0.1}
            min={0}
          />
          <NumberInput
            label="Total water (per cell)"
            value={waterData.waterTotalPerCell}
            onChange={(value) => setWaterValue("waterTotalPerCell", value)}
            step={0.1}
            min={0}
          />
          <NumberInput
            label="Rain max per cell"
            value={waterData.waterRainMaxPerCell}
            onChange={(value) => setWaterValue("waterRainMaxPerCell", value)}
            step={0.1}
            min={0}
          />
          <NumberInput
            label="Initial water per cell"
            value={waterData.waterFirstRainPerCell}
            onChange={(value) => setWaterValue("waterFirstRainPerCell", value)}
            step={0.1}
            min={0}
          />
          <NumberInput
            label="Evaporation"
            value={waterData.waterEvaporationPerCellPerGeneration}
            onChange={(value) => setWaterValue("waterEvaporationPerCellPerGeneration", value)}
            step={0.1}
            min={0}
          />
          <SelectInput
            label="Rain type"
            value={waterData.rainType}
            onChange={(value: string) => setWaterValue("rainType", value as RainType)}
          >
            {rainTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </div>
      </details>
    </div>
  );
}
