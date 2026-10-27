"use client";

import { ReactNode, useState } from "react";
import { useAtom } from "jotai";
import classNames from "classnames";
import { simulationDataAtom } from "../../store";
import NumberInput from "@/components/global/inputs/NumberInput";
import SelectInput from "@/components/global/inputs/SelectInput";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import { CONSTANTS_DEFAULT } from "@/simulation/constantsDefault";
import { ObjectColors } from "@/simulation/world/objects/objectColor";
import { AllowedLogEvents, LogEvent } from "@/simulation/logger/LogEvent";
import { Genus } from "@/simulation/creature/CreatureGenus";
import { GenusProbability } from "@/simulation/generations/population/selectGenusBasedOnProbability";
import useSetLogOptions from "../tools/useSetLogOptions";
import Section from "../Section";

type Constants = typeof CONSTANTS_DEFAULT;
type MassConstant = {
  [K in keyof WorldControllerData]-?: K extends Uppercase<K> ? K : never;
}[keyof WorldControllerData];


function ConstantRow({ name, description, children }: { name: string; description: ReactNode; children: ReactNode }) {
  return (
    // name | editor | what it does, with fixed widths so the columns line up; the panel can be
    // narrow on a wide screen, so the row wraps on its own width rather than a breakpoint
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-grey-mid py-1 last:border-b-0">
      <code className="w-64 max-w-full break-all text-xs">{name}</code>
      <div className="w-36 max-w-full">{children}</div>
      <p className="min-w-40 flex-1 text-xs">{description}</p>
    </div>
  );
}

function ConstantGroup({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="font-bold">{title}</h4>
      {description && <p className="text-xs">{description}</p>}
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

// Like TextInput, but only values that parse are passed to onChange
function ParsedTextInput<T>({ value, format, parse, onChange, swatch }: {
  value: T;
  format: (value: T) => string;
  parse: (text: string) => T | undefined;
  onChange: (value: T) => void;
  swatch?: boolean;
}) {
  const [text, setText] = useState(format(value));
  const [isEditing, setIsEditing] = useState(false);
  const shown = isEditing ? text : format(value);
  const isInvalid = isEditing && parse(text) === undefined;

  return (
    <div className="flex items-center gap-1">
      {swatch && (
        <span
          className="inline-block h-5 w-5 shrink-0 border border-grey-mid"
          // the colors are drawn over the white world canvas
          style={{ background: `linear-gradient(${format(value)}, ${format(value)}), white` }}
        />
      )}
      <input
        type="text"
        value={shown}
        onFocus={() => {
          setText(format(value));
          setIsEditing(true);
        }}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = parse(e.target.value);
          if (parsed !== undefined) onChange(parsed);
        }}
        onBlur={() => setIsEditing(false)}
        aria-invalid={isInvalid}
        className={classNames("w-0 min-w-0 grow bg-grey-mid p-1 text-sm", isInvalid && "outline outline-2 outline-red")}
      />
    </div>
  );
}

const parseColor = (text: string) => {
  const color = text.trim();
  return color !== "" && typeof CSS !== "undefined" && CSS.supports("color", color) ? color : undefined;
};

const parseSpecies = (text: string): Constants["POPULATION_DEFAULT_SPECIES"] | undefined => {
  try {
    const parsed = JSON.parse(text);
    const isValid = Array.isArray(parsed) && parsed.every((item) =>
      item && typeof item.name === "string" && Array.isArray(item.genome) &&
      item.genome.every((gene: unknown) => Number.isInteger(gene)));
    return isValid ? parsed : undefined;
  } catch {
    return undefined;
  }
};

// [key, step, what it does]; all of them are numbers of at least 0
const MASS_GROUPS: { title: string; rows: [MassConstant, number, string][] }[] = [
  {
    title: "Mass and metabolism",
    rows: [
      ["MASS_WATER_TO_MASS_PER_STEP", 0.01, "Water a plant turns into mass in one photosynthesis step, times the action's output."],
      ["MASS_AT_BIRTH_PLANT", 0.1, "Birth mass of a plant."],
      ["MASS_AT_BIRTH_ATTACK_PLANT", 0.1, "Birth mass of a herbivore."],
      ["MASS_AT_BIRTH_ATTACK_ANIMAL", 0.1, "Birth mass of a carnivore."],
      ["MASS_AT_BIRTH_ATTACK", 0.1, "Birth mass of the old \"attack\" genus (no longer used)."],
      ["MASS_MAX_MULTIPLE_MASS_AT_BIRT", 0.1, "Maximum mass, as a multiple of birth mass."],
      ["MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE", 0.01, "Mass spent per step for each gene, except the primary genes."],
      ["MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY", 0.01, "Mass spent per step for each primary gene (Reproduction, and Photosynthesis in plants)."],
    ],
  },
  {
    title: "Reproduction",
    rows: [
      ["REPRODUCTION_MULTIPLE_MASS_AT_BIRTH", 0.1, "Multiple of birth mass a creature needs to reproduce."],
      ["REPRODUCTION_COST_PER_MASS_TRY", 0.01, "Mass lost by a failed reproduction attempt, as a multiple of birth mass."],
      ["REPRODUCTION_COST_PER_MASS_DO", 0.01, "Mass lost by reproducing, as a multiple of birth mass."],
      ["ACTION_REPRODUCTION_OFFSET", 0.05, "Not used."],
    ],
  },
  {
    title: "Movement",
    rows: [
      ["MOVE_MULTIPLE_MASS_AT_BIRTH", 0.1, "Multiple of birth mass a creature needs to move."],
      ["MOVE_COST_PER_MASS_TRY", 0.01, "Mass lost by trying to move, as a multiple of birth mass."],
      ["MOVE_COST_PER_MASS_DO", 0.01, "Extra mass lost by moving, as a multiple of birth mass."],
    ],
  },
  {
    title: "Attack",
    rows: [
      ["ATTACK_COST_PER_MASS_TRY", 0.01, "Mass lost by trying to attack; a lighter creature dies trying."],
      ["ATTACK_COST_PER_MASS_DO", 0.01, "Mass lost by a successful attack."],
      ["ATTACK_MIN_PREY_MASS_FACTOR", 0.1, "The attacker must weigh at least this many times the prey."],
      ["ACTION_ATTACK_OFFSET", 0.05, "Minimum neuron output that triggers the attack actions."],
    ],
  },
];

const COLOR_ROWS: [keyof ObjectColors, string][] = [
  ["obstacle", "Color of the obstacles."],
  ["reproduction", "Color of the reproduction areas."],
  ["healing", "Color of the health areas that heal."],
  ["danger", "Color of the health areas that hurt."],
  ["spawn", "Color of the spawn areas."],
];

const GENERA: { genus: Genus; label: string }[] = [
  { genus: "plant", label: "Plant" },
  { genus: "attack_plant", label: "Herb." },
  { genus: "attack_animal", label: "Carn." },
];

const LOG_EVENTS = Object.values(LogEvent);

const LOCALES = ["es-ES", "en-US"];

// Every value of the constants file (simulation/constantsDefault.ts) and the model constants
// of worldControllerData, one per line. They edit the draft like the rest of the Scenario tab,
// except the LOG_* ones, which apply at once like in Tools → Logger.
export default function ScenarioConstants({ onGenusProbabilityChange }: {
  onGenusProbabilityChange: (genus: Genus, probability: number) => void;
}) {
  const [simulationData, setSimulationData] = useAtom(simulationDataAtom);
  const setLogOptions = useSetLogOptions();

  // older files can lack some constants: show the defaults for those
  const constants: Constants = {
    ...CONSTANTS_DEFAULT,
    ...simulationData.constants,
    colors: { ...CONSTANTS_DEFAULT.colors, ...simulationData.constants?.colors },
  };
  const { worldControllerData } = simulationData;
  const genusList: GenusProbability[] = constants.POPULATION_DEFAULT_GENUS ?? [];
  const allowedEvents: Partial<AllowedLogEvents> = constants.LOG_ALLOWED_EVENTS ?? {};
  const allowedCount = LOG_EVENTS.filter((event) => allowedEvents[event]).length;

  const setConstant = <K extends keyof Constants>(key: K, value: Constants[K]) =>
    setSimulationData((prev) => ({ ...prev, constants: { ...prev.constants, [key]: value } }));

  const setColor = (key: keyof ObjectColors, value: string) =>
    setSimulationData((prev) => ({
      ...prev,
      constants: {
        ...prev.constants,
        colors: { ...CONSTANTS_DEFAULT.colors, ...prev.constants?.colors, [key]: value },
      },
    }));

  const setWorldValue = (key: MassConstant, value: number) =>
    setSimulationData((prev) => ({
      ...prev,
      worldControllerData: { ...prev.worldControllerData, [key]: value },
    }));

  return (
    <Section
      title="Constants"
      description="Advanced values of the model. Like the other settings, they are applied with Update simulation or Restart, except the logger ones, which apply at once."
    >
      <div className="flex flex-col gap-6">
        {MASS_GROUPS.map((group) => (
          <ConstantGroup key={group.title} title={group.title}>
            {group.rows.map(([key, step, description]) => (
              <ConstantRow key={key} name={key} description={description}>
                <NumberInput
                  value={worldControllerData[key] ?? 0}
                  onChange={(value) => setWorldValue(key, value)}
                  step={step}
                  min={0}
                />
              </ConstantRow>
            ))}
          </ConstantGroup>
        ))}

        <ConstantGroup title="Population, selection and sensors">
          <ConstantRow name="POPULATION_DEFAULT_GENUS" description="Genus probabilities of generation 1 in Random Fixed Genera (plant, herbivore, carnivore).">
            <div className="grid grid-cols-3 gap-1">
              {GENERA.map(({ genus, label }) => (
                <NumberInput
                  key={genus}
                  label={<span className="text-xs">{label}</span>}
                  value={genusList.find((item) => item.genus === genus)?.probability ?? 0}
                  onChange={(value) => onGenusProbabilityChange(genus, value)}
                  step={0.05}
                  min={0}
                  max={1}
                />
              ))}
            </div>
          </ConstantRow>
          <ConstantRow name="POPULATION_DEFAULT_SPECIES" description="List of {name, genome} as JSON. Not used by any strategy.">
            <ParsedTextInput
              value={constants.POPULATION_DEFAULT_SPECIES}
              format={(value) => JSON.stringify(value)}
              parse={parseSpecies}
              onChange={(value) => setConstant("POPULATION_DEFAULT_SPECIES", value)}
            />
          </ConstantRow>
          <ConstantRow name="GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS" description="Share of creatures (0 - 1) that Greatest Distance selects.">
            <NumberInput
              value={constants.GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS}
              onChange={(value) => setConstant("GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS", value)}
              step={0.01}
              min={0}
              max={1}
            />
          </ConstantRow>
          <ConstantRow name="GREATEST_MASS_SELECTION_TOP_SURVIVORS" description="Share of creatures (0 - 1) that Greatest Mass selects.">
            <NumberInput
              value={constants.GREATEST_MASS_SELECTION_TOP_SURVIVORS}
              onChange={(value) => setConstant("GREATEST_MASS_SELECTION_TOP_SURVIVORS", value)}
              step={0.01}
              min={0}
              max={1}
            />
          </ConstantRow>
          <ConstantRow name="DETECT_RADIUS" description="Radius, in cells, of the prey sensors.">
            <NumberInput
              value={constants.DETECT_RADIUS}
              onChange={(value) => setConstant("DETECT_RADIUS", value)}
              integer
              min={1}
            />
          </ConstantRow>
        </ConstantGroup>

        <ConstantGroup title="Map colors" description="Any CSS color. The map editor shows the changes at once.">
          {COLOR_ROWS.map(([key, description]) => (
            <ConstantRow key={key} name={`colors.${key}`} description={description}>
              <ParsedTextInput
                value={constants.colors[key]}
                format={(value) => value}
                parse={parseColor}
                onChange={(value) => setColor(key, value)}
                swatch
              />
            </ConstantRow>
          ))}
        </ConstantGroup>

        <ConstantGroup title="Files and simulation code">
          <ConstantRow name="PRETTIFY_OUTPUT_TO_COPY" description="Indent the JSON of the simulation copied from the Save tab.">
            <CheckboxInput
              id="const-prettify-copy"
              checked={Boolean(constants.PRETTIFY_OUTPUT_TO_COPY)}
              onChange={(checked) => setConstant("PRETTIFY_OUTPUT_TO_COPY", checked)}
            />
          </ConstantRow>
          <ConstantRow name="PRETTIFY_OUTPUT_TO_FILE" description="Indent the JSON of the saved .sim files.">
            <CheckboxInput
              id="const-prettify-file"
              checked={Boolean(constants.PRETTIFY_OUTPUT_TO_FILE)}
              onChange={(checked) => setConstant("PRETTIFY_OUTPUT_TO_FILE", checked)}
            />
          </ConstantRow>
          <ConstantRow name="SIM_CODE_LENGTH" description="Length of the random simulation code made at each Restart.">
            <NumberInput
              value={constants.SIM_CODE_LENGTH}
              onChange={(value) => setConstant("SIM_CODE_LENGTH", value)}
              integer
              min={1}
              max={20}
            />
          </ConstantRow>
        </ConstantGroup>

        <ConstantGroup title="Logger" description="These apply at once to the running simulation, as in Tools → Logger.">
          <ConstantRow name="LOG_ENABLED" description="Main switch of the logger. Turning it off deletes the log.">
            <CheckboxInput
              id="const-log-enabled"
              checked={Boolean(constants.LOG_ENABLED)}
              onChange={(checked) => setLogOptions({ LOG_ENABLED: checked })}
            />
          </ConstantRow>
          <ConstantRow name="LOG_CREATURE_ID" description="-1 only totals, 0 all creatures, -10 / -30 ids below 10 / 30, else that id.">
            <NumberInput
              value={constants.LOG_CREATURE_ID}
              onChange={(value) => setLogOptions({ LOG_CREATURE_ID: value })}
              integer
            />
          </ConstantRow>
          <ConstantRow name="LOG_STEP_TOTALS" description="Write the totals of each step, not only of each generation.">
            <CheckboxInput
              id="const-log-step-totals"
              checked={Boolean(constants.LOG_STEP_TOTALS)}
              onChange={(checked) => setLogOptions({ LOG_STEP_TOTALS: checked })}
            />
          </ConstantRow>
          <ConstantRow name="LOG_EVENTLOGGER_MAX_EVENTS" description="The logger stops when it has written this many events.">
            <NumberInput
              value={constants.LOG_EVENTLOGGER_MAX_EVENTS}
              onChange={(value) => setLogOptions({ LOG_EVENTLOGGER_MAX_EVENTS: value })}
              integer
              min={1}
            />
          </ConstantRow>
          <ConstantRow name="LOG_LOCALE_STRING" description="Locale of the numbers in the log (sets the decimal separator).">
            <SelectInput
              value={constants.LOG_LOCALE_STRING}
              onChange={(value: string) => setLogOptions({ LOG_LOCALE_STRING: value })}
            >
              {[...new Set([...LOCALES, constants.LOG_LOCALE_STRING])].map((locale) => (
                <option key={locale} value={locale}>{locale}</option>
              ))}
            </SelectInput>
          </ConstantRow>
          <ConstantRow name="LOG_ALLOWED_EVENTS" description="Event types the logger writes.">
            <details>
              <summary className="cursor-pointer text-sm">
                {allowedCount} of {LOG_EVENTS.length} on
              </summary>
              <div className="mt-1 flex flex-col gap-1">
                {LOG_EVENTS.map((event) => (
                  <CheckboxInput
                    key={event}
                    id={`const-log-event-${event}`}
                    label={<span className="text-xs">{event}</span>}
                    checked={Boolean(allowedEvents[event])}
                    onChange={(checked) =>
                      setLogOptions({
                        LOG_ALLOWED_EVENTS: { ...allowedEvents, [event]: checked } as AllowedLogEvents,
                      })
                    }
                  />
                ))}
              </div>
            </details>
          </ConstantRow>
        </ConstantGroup>
      </div>
    </Section>
  );
}
