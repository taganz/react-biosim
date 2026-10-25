"use client";

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
import { SimulationType } from "@/simulation/generations/SimulationType";
import { RainType, rainTypeOptions } from "@/simulation/water/RainType";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
import { WaterData } from "@/simulation/water/WaterData";
import UpdateParametersButton from "../../UpdateParametersButton";
import RestartButton from "../../RestartButton";
import useWorldValue from "@/hooks/useWorldValue";
import Section, { FIELDS_GRID } from "../Section";
import { DEFAULT_GENUS_PROBABILITIES } from "@/simulation/constantsDefault";
import { Genus } from "@/simulation/creature/CreatureGenus";
import { GenusProbability } from "@/simulation/generations/population/selectGenusBasedOnProbability";

const getPrettyName = (name: string) => name.replace(/([A-Z])/g, " $1").trim();

const getSensorLabel = (sensor: Sensor) =>
  `${getPrettyName(sensor.name)} (${sensor.neuronCount} ${
    sensor.neuronCount == 1 ? "neuron" : "neurons"
  })`;

const getActionLabel = (action: Action) => `${getPrettyName(action.name)} (1 neuron)`;

const GENERA: { genus: Genus; label: string }[] = [
  { genus: "plant", label: "Plant" },
  { genus: "attack_plant", label: "Herbivore (attack_plant)" },
  { genus: "attack_animal", label: "Carnivore (attack_animal)" },
];

// The share of creatures each entry gets, picked the way selectGenusBasedOnProbability
// does: in list order, and the last entry takes whatever is left below 1.
const getGenusShares = (list: GenusProbability[]) => {
  let cumulative = 0;
  const shares = list.map((item) => {
    const start = Math.min(cumulative, 1);
    cumulative += item.probability;
    return Math.max(0, Math.min(cumulative, 1) - start);
  });
  if (shares.length) shares[shares.length - 1] += Math.max(0, 1 - cumulative);
  return shares;
};

// Why CreatureGenus.geneArrayForGenus cannot build a genome for this genus with the
// draft's enabled sensors and actions: it would pick from an empty list and write a broken gene.
const getGenusProblems = (
  genus: Genus,
  sensors: Sensor[],
  actions: Action[],
  enabledSensors: SensorName[],
  enabledActions: ActionName[],
  initialGenomeSize: number
) => {
  const problems: string[] = [];
  if (!sensors.some((sensor) => enabledSensors.includes(sensor.name) && sensor.compatibleGenus.includes(genus))) {
    problems.push("No enabled sensor is compatible with this genus.");
  }
  const mainActions = actions.filter((action) => action.mainGenus === genus);
  if (!mainActions.some((action) => enabledActions.includes(action.name))) {
    problems.push(
      mainActions.length
        ? `Its main action (${mainActions.map((action) => getPrettyName(action.name)).join(", ")}) is not enabled.`
        : "No action defines this genus."
    );
  }
  if (
    initialGenomeSize > 1 &&
    !actions.some((action) => enabledActions.includes(action.name) && action.compatibleGenus.includes(genus))
  ) {
    problems.push("No enabled action is compatible with this genus, so its other genes cannot be built.");
  }
  return problems;
};

function GenusListEditor({
  genusList, sensors, actions, enabledSensors, enabledActions, initialGenomeSize, onChange,
}: {
  genusList: GenusProbability[];
  sensors: Sensor[];
  actions: Action[];
  enabledSensors: SensorName[];
  enabledActions: ActionName[];
  initialGenomeSize: number;
  onChange: (genus: Genus, probability: number) => void;
}) {
  // entries keep the order of the saved list, which decides who gets the leftover share
  const rows = [
    ...genusList,
    ...GENERA.filter(({ genus }) => !genusList.some((item) => item.genus === genus))
      .map(({ genus }) => ({ genus, probability: 0 })),
  ];
  const shares = getGenusShares(genusList);
  const total = genusList.reduce((sum, item) => sum + item.probability, 0);
  const isTotalOne = Math.abs(total - 1) < 1e-9;
  const lastGenus = genusList.at(-1)?.genus;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-grey-mid p-3">
      <h4 className="font-bold">Genera of generation 1</h4>
      <p className="text-xs">
        Each creature of generation 1 gets a genus picked with these probabilities, and a new random
        genome of {initialGenomeSize} {initialGenomeSize === 1 ? "gene" : "genes"} for it: one main gene
        that connects a sensor to the action that defines the genus, plus random genes that connect
        sensors and actions compatible with the genus. Later generations are children of the survivors.
        Apply changes with Restart.
      </p>
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_8rem_6rem]">
        {rows.map(({ genus, probability }, index) => {
          const label = GENERA.find((item) => item.genus === genus)?.label ?? genus;
          const mainActions = actions
            .filter((action) => action.mainGenus === genus)
            .map((action) => getPrettyName(action.name));
          const share = index < shares.length ? shares[index] : 0;
          // only genera that get creatures need to be buildable
          const problems = share > 0
            ? getGenusProblems(genus, sensors, actions, enabledSensors, enabledActions, initialGenomeSize)
            : [];
          return (
            <div key={genus} className="contents">
              <div className="flex flex-col justify-end">
                <span>{label}</span>
                <span className="text-xs">
                  Main gene: {mainActions.length ? mainActions.join(", ") : "none"}
                </span>
              </div>
              <NumberInput
                label="Probability"
                value={probability}
                onChange={(value) => onChange(genus, value)}
                step={0.05}
                min={0}
                max={1}
              />
              <div className="flex flex-col justify-end text-sm">
                <span className="text-xs">Share</span>
                <span>{(share * 100).toFixed(0)}%</span>
              </div>
              {problems.length > 0 && (
                <div className="bg-red p-2 text-sm sm:col-span-3">
                  <p>Generation 1 cannot build valid genomes for this genus:</p>
                  <ul className="list-disc pl-5">
                    {problems.map((problem) => <li key={problem}>{problem}</li>)}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {genusList.length === 0 ? (
        <p className="bg-red p-2 text-sm">
          The list is empty, so generation 1 cannot be created. Give at least one genus a probability.
        </p>
      ) : !isTotalOne && (
        <p className="bg-red p-2 text-sm">
          The probabilities add up to {Number(total.toFixed(3))}, not 1.{" "}
          {total < 1
            ? `The rest goes to the last genus in the list${lastGenus ? ` (${lastGenus})` : ""}.`
            : "Genera later in the list get less than their probability, or nothing."}
        </p>
      )}
    </div>
  );
}

// Edits a draft (simulationDataAtom), the settings of the Scenario tab. The running simulation keeps its own
// simulationData until the draft is applied with "Update simulation" or "Restart".
export default function ScenarioSettings() {
  const worldController = useAtomValue(worldControllerAtom);
  const [simulationData, setSimulationData] = useAtom(simulationDataAtom);
  const appliedSimulationData = useWorldValue((world) => world.simData, null);
  const hasPendingChanges =
    appliedSimulationData !== null && appliedSimulationData !== simulationData;


  const { worldControllerData, worldGenerationsData, waterData } = simulationData;
  const { enabledSensors, enabledActions } = worldGenerationsData;
  const isContinuous = worldGenerationsData.simulationType === "continuous";
  // in continuous runs, new creatures only come from the Reproduction action
  const continuousWarnings = !isContinuous ? [] : [
    !worldGenerationsData.metabolismEnabled &&
      "Metabolism is off, so mass never changes and the Reproduction action never succeeds.",
    !enabledActions.includes("Reproduction") && "The Reproduction action is not enabled.",
  ].filter((warning): warning is string => Boolean(warning));
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

  // Strategies that build creatures from a genus also need the main action of each genus
  // (the one that defines it), so those actions are enabled, and metabolism with them.
  const withGenusActions = (data: WorldGenerationsData, genera: Genus[]): WorldGenerationsData => {
    if (!genera.length || !actions.length) return data;
    // kept in table order, which is the order genes use to address actions
    const enabledActions = actions
      .filter((action) =>
        data.enabledActions.includes(action.name) ||
        (action.mainGenus !== null && genera.includes(action.mainGenus)) ||
        // every genus needs to reproduce
        action.name === "Reproduction")
      .map((action) => action.name);
    // genus actions (Photosynthesis, attacks) only change mass with metabolism on
    return { ...data, enabledActions, metabolismEnabled: true };
  };

  const activeGenera = (list: GenusProbability[]) =>
    list.filter((item) => item.probability > 0).map((item) => item.genus);

  // Random Fixed Genera needs a genus list; older files and the startup scenario have none,
  // so the default list is copied into the draft (and saved with it).
  const handlePopulationStrategyChange = (value: string) =>
    setSimulationData((prev) => {
      let constants = prev.constants;
      const genusList: GenusProbability[] | undefined = constants?.POPULATION_DEFAULT_GENUS;
      if (value === "RandomFixedGenePopulation" && !genusList?.length) {
        constants = {
          ...constants,
          POPULATION_DEFAULT_GENUS: DEFAULT_GENUS_PROBABILITIES.map((item) => ({ ...item })),
        };
      }

      const genera: Genus[] =
        value === "RandomFixedGenePopulation"
          ? activeGenera(constants.POPULATION_DEFAULT_GENUS)
          : value === "PlantHerbivorePopulation"
          ? ["plant", "attack_plant"]
          : [];

      return {
        ...prev,
        constants,
        worldGenerationsData: withGenusActions(
          { ...prev.worldGenerationsData, populationStrategy: selectPopulationStrategy(value) },
          genera
        ),
      };
    });

  // the genus list of Random Fixed Genera; a genus raised above 0 needs its actions too
  const isRandomFixedGene = worldGenerationsData.populationStrategy.name === "RandomFixedGenePopulation";
  const genusList: GenusProbability[] = simulationData.constants?.POPULATION_DEFAULT_GENUS ?? [];
  const handleGenusProbabilityChange = (genus: Genus, probability: number) =>
    setSimulationData((prev) => {
      const current: GenusProbability[] = prev.constants?.POPULATION_DEFAULT_GENUS ?? [];
      const list = current.some((item) => item.genus === genus)
        ? current.map((item) => (item.genus === genus ? { ...item, probability } : item))
        : [...current, { genus, probability }];
      return {
        ...prev,
        constants: { ...prev.constants, POPULATION_DEFAULT_GENUS: list },
        worldGenerationsData: withGenusActions(prev.worldGenerationsData, probability > 0 ? [genus] : []),
      };
    });

  const handleDiscard = () => {
    if (appliedSimulationData) setSimulationData(appliedSimulationData);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* === APPLY CHANGES === */}
      <div
        className={classNames(
          "sticky top-(--control-bar-height) z-10 flex flex-col gap-2 rounded-md p-3",
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
        <div className={FIELDS_GRID}>
          <div className="flex flex-col gap-1">
            <CheckboxInput
              id="metabolismEnabled"
              label="Metabolism"
              checked={worldGenerationsData.metabolismEnabled}
              onChange={(checked) => setGenerationsValue("metabolismEnabled", checked)}
            />
            <p className="text-xs">
              On: creatures gain mass by photosynthesis or by eating prey, and spend it every step
              and when they move, attack or reproduce. They die when it reaches 0. Off: mass never
              changes, so the Reproduction action never succeeds.
            </p>
          </div>
        </div>
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
            // every creature needs its own cell, and the engine refuses a full world
            max={worldControllerData.size * worldControllerData.size - 1}
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
          <div className="flex flex-col gap-1">
            <SelectInput
              label="Simulation type"
              value={worldGenerationsData.simulationType}
              onChange={(value: string) => setGenerationsValue("simulationType", value as SimulationType)}
            >
              <option value="generational">Generational</option>
              <option value="continuous">Continuous</option>
            </SelectInput>
            <ul className="text-xs">
              <li><b>Generational:</b> at the end of each generation the selection method picks the survivors, and the next generation is made of their children.</li>
              <li><b>Continuous:</b> creatures carry on from one generation to the next. They are born with the Reproduction action and die of hunger, attacks or old age. A generation is only a time window for the stats.</li>
            </ul>
          </div>
          {isContinuous && (
            <div className="flex flex-col gap-1">
              <NumberInput
                label="Maximum age (steps)"
                value={worldGenerationsData.maxAge}
                onChange={(value) => setGenerationsValue("maxAge", value)}
                integer
                min={1}
              />
              <p className="text-xs">A creature older than this dies.</p>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <SelectInput
              label="Population strategy"
              value={worldGenerationsData.populationStrategy.name}
              onChange={handlePopulationStrategyChange}
            >
              {populationStrategyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
            {isContinuous && (
              <p className="text-xs">Continuous runs use it only to create generation 1.</p>
            )}
          </div>
          {!isContinuous && (
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
          )}
        </div>
        {isRandomFixedGene && (
          <GenusListEditor
            genusList={genusList}
            sensors={sensors}
            actions={actions}
            enabledSensors={enabledSensors}
            enabledActions={enabledActions}
            initialGenomeSize={worldGenerationsData.initialGenomeSize}
            onChange={handleGenusProbabilityChange}
          />
        )}
        {continuousWarnings.length > 0 && (
          <div className="bg-red p-2 text-sm">
            <p>No creature can be born in this continuous run:</p>
            <ul className="list-disc pl-5">
              {continuousWarnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        )}
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

      {/* === WATER === */}
      <Section title="Water">
        <div className={FIELDS_GRID}>
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
      </Section>
    </div>
  );
}
