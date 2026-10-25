"use client";

import NumberInput from "@/components/global/inputs/NumberInput";
import SelectInput from "@/components/global/inputs/SelectInput";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import TextInput from "@/components/global/inputs/TextInput";
import { PhenoTypeColorMode } from "@/simulation/creature/PhenoTypeColorMode";
import useWorldValue from "@/hooks/useWorldValue";
import { FIELDS_GRID } from "../Section";
import CollapsibleSection from "../CollapsibleSection";
import useSetRunOptions from "./useSetRunOptions";
import FitnessGraph from "./FitnessGraph";
import WorldWaterStatus from "./WorldWaterStatus";

// the generator keeps 32 bits of the seed
const MAX_SEED = 0xffffffff;

// Options of the running simulation. Unlike the Scenario tab they have no draft:
// they apply at once (the seed, at the next Restart).
export default function SimulationPanel() {
  const setRunOptions = useSetRunOptions();
  const simCode = useWorldValue((world) => world.simCode, "");
  const seed = useWorldValue((world) => world.simData.worldControllerData.seed, undefined);
  // the seed of the running simulation, which the settings may not have (random seed)
  const runSeed = useWorldValue((world) => world.seed, null);
  const phenotypeColorMode = useWorldValue<PhenoTypeColorMode>(
    (world) => world.generations.phenotypeColorMode,
    "genome"
  );
  const isSeedFixed = seed !== undefined;

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleSection title="Run">
        <div className={FIELDS_GRID}>
          <div className="flex flex-col gap-1">
            <TextInput
              label="Simulation code"
              value={simCode}
              onChange={(value) => setRunOptions({ simCode: value })}
              maxLength={20}
              // it goes into file names
              disallowed={/[^A-Za-z0-9_-]/g}
            />
            <p className="text-xs">
              A name for this run, used in the names of saved files, images, GIFs and logs. A change applies
              at once, and later restarts keep it. Otherwise Restart picks a new random code, unless the seed is
              fixed and the scenario has not changed.
            </p>
          </div>
        </div>
        <div className={FIELDS_GRID}>
          <div className="flex flex-col gap-1">
            <CheckboxInput
              id="fixedSeed"
              label="Fixed seed"
              checked={isSeedFixed}
              // fixing the seed starts from the one the running simulation uses
              onChange={(checked) => setRunOptions({ seed: checked ? runSeed ?? 0 : null })}
            />
            {isSeedFixed && (
              <NumberInput
                label="Seed"
                value={seed ?? 0}
                onChange={(value) => setRunOptions({ seed: value })}
                integer
                min={0}
                max={MAX_SEED}
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs">
              {isSeedFixed
                ? "Every Restart repeats the same simulation (same settings and map). Change the seed to get another one."
                : "Every Restart picks a new random seed, so no two runs are the same."}{" "}
              The seed is used when the simulation starts, so it takes effect at the next Restart.
            </p>
            {runSeed !== null && (
              <p className="text-xs">
                The running simulation uses seed <b>{runSeed}</b>.
                {seed !== runSeed && (
                  <>
                    {" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setRunOptions({ seed: runSeed })}
                    >
                      Fix this seed
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        <div className={FIELDS_GRID}>
          <div className="flex flex-col gap-1">
            <SelectInput
              label="Phenotype mode"
              value={phenotypeColorMode}
              onChange={(value: string) =>
                setRunOptions({ phenotypeColorMode: value as PhenoTypeColorMode })
              }
            >
              <option value="genome">Genome</option>
              <option value="trophicLevel">Trophic level</option>
            </SelectInput>
            <ul className="text-xs">
              <li><b>Genome:</b> the colour comes from the genome, so each species has its own colour.</li>
              <li><b>Trophic level:</b> green for plants, blue for herbivores and red for carnivores. The shade comes from the genome.</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>
      <FitnessGraph />
      <WorldWaterStatus />
    </div>
  );
}
