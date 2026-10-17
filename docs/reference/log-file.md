# The log file

The event logger records what happens during a run and saves it as a CSV file. This page describes the file: its columns, the five kinds of rows, every event the engine writes, and the exact rows of one creature when every option is on. How to use the logger from the UI is in [Settings and stats](../user/settings-and-stats.md#under-development-logger). The code is in [EventLogger.ts](../../simulation/logger/EventLogger.ts) and [LogEvent.ts](../../simulation/logger/LogEvent.ts).

## The file

**Save log** (*Stats → Logger*) downloads `sim <code> generation <n>_creature <id>.csv`, the same pattern as the `.sim`, GIF and PNG files plus the creature filter: `<code>` is the simulation code, `<n>` the current generation and `<id>` the **Creature to log** of the last recording (`0`, `-10`, `-30` or a creature id). It is plain UTF-8 text:

- The separator is `;`.
- The first line is the header.
- Numbers are formatted with the locale in **Number format (locale)** (`LOG_LOCALE_STRING`, default `es-ES`), with at most 2 decimals. With `es-ES` the decimal separator is a comma and numbers of 5 digits or more get a dot as thousands separator (`12.345,67`).
- The log is kept in memory until **Delete log**. **Start recording** deletes it first, and so does turning the logger off. They ask first when the log has events that have not been saved.

A Power BI report to analyse it is in `public/analyze simlog.pbix`.

## Columns

| Column | Content |
|---|---|
| `LogLevel` | The kind of row: `SETUP`, `CREATURE`, `STEP TOTALS`, `GENERATION TOTALS` or `WORLD EVENTS` (see below). |
| `StepIndex` | Counter of the steps recorded since recording started. It starts at 1 and goes up by one every time the step or the generation changes, so it keeps growing across generations. |
| `CurrentGen` | Generation. |
| `CurrentStep` | Step within the generation (1 to *Steps per generation*). Empty in generation totals. |
| `SpeciesId` | Species of the creature: the colour of its genome as a hex string. Creature rows only. |
| `GenusId` | `plant`, `attack_plant`, `attack_animal` or `unknown`. Creature rows only. |
| `CreatureId` | Id of the creature. Creature rows only. |
| `EventType` | The event, see [Events](#events). |
| `ParamName` | What the value is. Totals add ` sum` to it. |
| `ParamValue` | First value. `0` when the event has no value. |
| `ParamValue2` | Second value. `0` when the event has no second value; empty in totals. |
| `ParamString` | A text value (direction, death cause, killer species, a text setting). Empty when not used. |

## Kinds of rows

| `LogLevel` | Written by | One row per… |
|---|---|---|
| `SETUP` | the logger | setting and constant, when a recording starts (see [Setup rows](#setup-rows)) |
| `CREATURE` | `Creature.log()` | creature event |
| `STEP TOTALS` | the logger | event type and `ParamName` that happened in a step |
| `GENERATION TOTALS` | the logger | event type and `ParamName` that happened in a generation |
| `WORLD EVENTS` | `WorldController.log()` | population and water value at the start of a generation, at the end of a step and at the end of a generation, and the survivors of each generation |

Which kinds are written depends on two settings. `SETUP`, `GENERATION TOTALS` and `WORLD EVENTS` rows are always written.

- `CREATURE` rows are written unless **Creature to log** (`LOG_CREATURE_ID`) is *No creatures* (`-1`, the default).
- `STEP TOTALS` rows are written while **Step totals** (`LOG_STEP_TOTALS`, default off) is on.

Files saved with the old `LOG_LEVEL` setting are converted when they are loaded: *Creature events* keeps the creature filter, *Step totals* becomes *No creatures*, and *Generation totals* or *World events only* become *No creatures* with **Step totals** off.

### Setup rows

A block of `SETUP` rows records the configuration the log was made with. It is written:

- when a recording starts, before its first row: **Start recording**, at the step 1 where recording begins;
- every time the run is set up (**Restart**, a loaded file or setup, **Update simulation**, the restart after an extinction) while the logger is recording. These currently pause the logger, unless a recording from *Generation 1* is waiting for it, so in practice the block comes with the start of the recording.

They are always written, are not in **Events to record**, and do not count for **Maximum events** (nor for the number of events shown in Stats). They only need the logger to be enabled and recording.

| Column | Content |
|---|---|
| `StepIndex`, `CurrentGen`, `CurrentStep` | Where the recording starts. |
| `EventType` | `SETTING` for a value of the Settings tab, `CONSTANT` for a constant. |
| `ParamName` | The key of the setting (`size`, `mutationProbability`…), `sensor.<name>` / `action.<name>`, or the name of the constant. Nested constants get a path: `LOG_ALLOWED_EVENTS.MOVE`, `POPULATION_DEFAULT_GENUS.0.probability`, `colors.obstacle`. |
| `ParamValue` | The value of a number, up to 10 decimals; `1` or `0` for a checkbox or other true/false value; `0` for a text value. |
| `ParamValue2` | `0`. |
| `ParamString` | The value of a text setting or constant (`simCode`, `mutationMode`, `populationStrategy`, `LOG_LOCALE_STRING`…); empty for numbers. |

The rows come in this order:

1. **Settings** (`SETTING`), in the order of the Settings tab ([Parameters](parameters.md#settings-tab)): `simCode`, `phenotypeColorMode`, `metabolismEnabled`, `size`, `initialPopulation`, `stepsPerGen`, `seed` (`random` in `ParamString` when it is not fixed), `runSeed` (the seed this run uses), `simulationType`, `maxAge`, `populationStrategy`, `selectionMethod`, `initialGenomeSize`, `maxGenomeSize`, `maxNumberNeurons`, `mutationMode`, `mutationProbability`, `geneInsertionDeletionProbability`, `deletionRatio`; then one `sensor.<name>` row for every sensor and one `action.<name>` row for every action, in [table order](sensors-and-actions.md), with `1` if it is enabled and `0` if not; then the six water settings.
2. **Constants** (`CONSTANT`): the upper case values of `worldControllerData` (`MASS_*`, `REPRODUCTION_*`, `MOVE_*`, `ATTACK_*`…), then everything in `constants` (`LOG_*`, selection percentages, `POPULATION_DEFAULT_*`, `SIM_CODE_LENGTH`, colours…).

The values are those of the running simulation, not of the Settings draft.

### Totals

A totals row **counts** events, it does not add their values: `METABOLISM;mass sum;37` means that 37 `METABOLISM` rows with `ParamName` `mass` happened in that step, whatever the masses were. Only creature events are counted, and only those that pass the creature filter and are switched on in **Events to record**, also with *No creatures*, which writes no creature rows: then every creature is counted. `BIRTH genome` is not counted: `BIRTH parentId` already counts the births.

The totals of a step are written when the first event of the next step arrives, with the generation and step they belong to. The totals of a generation are written in the same way, after the step totals of its last step.

### Filters

An event is written only if all of these hold:

1. The logger is enabled (`LOG_ENABLED`) and recording, and has fewer rows than **Maximum events** (`LOG_EVENTLOGGER_MAX_EVENTS`). When it reaches the maximum it stops.
2. Its event type is on in **Events to record** (`LOG_ALLOWED_EVENTS`).
3. For creature events, the creature passes **Creature to log** (`LOG_CREATURE_ID`): `-1` (*No creatures*) writes no creature rows, `0` is every creature, `-10` ids 1 to 9, `-30` ids 1 to 29, any other number that id only. The logger reads it when a recording starts; a change during a recording is used from the next one.
4. Its kind is written: creature rows unless **Creature to log** is *No creatures*, step totals while **Step totals** is on (totals still count the creature events that pass 1–3).

Recording starts at step 1 of a generation: **Start recording** waits for step 1 of generation 1 or of the next generation, as chosen in **From**. Events before that are dropped.

To save work, `METABOLISM` events and the `PHOTOSYNTHESIS` events are only written on steps that are multiples of 10 (10, 20, 30…). All other events are written on every step.

## Events

### Creature events

| `EventType` | `ParamName` | `ParamValue` | `ParamValue2` | `ParamString` | When |
|---|---|---|---|---|---|
| `BIRTH` | `parentId` | id of the parent, `0` if it has none | birth generation of the parent, `0` if it has none | | A new creature is created, after its `INFO birth` rows. The parent is the survivor or the reproducing creature whose genome it got; creatures with a random or fixed genome (generation 1, random fill) have none. Creatures restored by **Update simulation** or a resumed file are not births and write no `BIRTH`. |
| `BIRTH` | `genome` | `0` | `0` | the genome in hexadecimal: one 8-digit gene per group, separated by spaces | Right after `BIRTH parentId`. Same format as the genome you can copy in the species panel. |
| `INFO` | `birth mass`, `birth gen`, … | see [INFO rows](#info-rows) | | | The creature is created. |
| `INFO` | `dead mass`, `dead gen`, … | see [INFO rows](#info-rows) | | | The creature dies, after `DEAD`. |
| `METABOLISM` | `mass` | mass after the basal consumption | | | Every step (multiples of 10). |
| `METABOLISM` | `basalConsumption` | mass spent on basal metabolism | | | Every step (multiples of 10). |
| `METABOLISM` | `actionsExecutionConsumption` | mass spent on the actions of the brain | | | Every step (multiples of 10). |
| `PHOTOSYNTHESIS` | `actionInputValue` | output of the Photosynthesis neuron | | | The neuron output is above 0 (multiples of 10). |
| `PHOTOSYNTHESIS` | `waterGotFromCell` | water taken from the cell | | | Same. |
| `REPRODUCE_TRY` | `mass` | mass of the creature | | | The Reproduction neuron output is above 0 and the creature has the mass to reproduce. Without that mass no row is written. |
| `REPRODUCE_TRY` | `mass consumed` | mass spent on the failed try | | | No free cell and nothing to eat around. |
| `REPRODUCE` | `actionInputValue` | output of the Reproduction neuron | | | The child was born. |
| `REPRODUCE` | `mass` | mass of the parent after giving birth | | | Same. |
| `ATTACK_TRY` | `actionInputValue` | output of the attack neuron | | | An attack neuron fires and there is a neighbour the creature can eat. |
| `ATTACK_TRY` | `targetDirection` | `0` | `0` | `N`, `E`, `S` or `W` | Same. |
| `ATTACK` | `preyMass` | mass the prey had before it was eaten | | | The prey was killed, by an attack or by a parent making room for its child. |
| `MOVE_TRY` | `x,y` | x step: −1, 0 or 1 | y step: −1, 0 or 1 | | The creature tries to move. |
| `MOVE` | `direction` | x step | y step | `N`, `NE`, `E`, `SE`, `S`, `SW`, `W` or `NW` | The move succeeded. `N` is +y. |
| `MOVE` | `position x + 100y` | `x + 100 × y` of the new position | | | The move succeeded, after `MOVE direction`. |
| `DEAD_ATTACKED` | `killerSpecie` | x of the position | y of the position | species of the killer | The creature is killed by an attack. |
| `DEAD` | `cause` | `0` | `0` | `old`, `basalConsumption`, `actionsExecutionConsumption`, `attacked`, `health` or `unknown` | The creature dies. |

### INFO rows

`INFO` always comes as a block of 8 rows. `<when>` is `birth` or `dead`:

| `ParamName` | `ParamValue` | `ParamValue2` |
|---|---|---|
| `<when> mass` | current mass | |
| `<when> gen` | current generation | |
| `<when> neuronsCount` | number of enabled actions (the same for every creature) | |
| `<when> _energyConsumedByActionsExecution` | enabled actions × cost per action | |
| `<when> stepBirth` | step in which it was born | |
| `<when> massAtBirth` | mass at birth | |
| `<when> position` | x | y |
| `<when> lastMovement` | x of the last move | y of the last move |

### World events

All with `LogLevel` `WORLD EVENTS` and empty creature columns:

| `EventType` | `ParamName` | `ParamValue` | When |
|---|---|---|---|
| `GENERATION_START` | `population` | live creatures | Step 1 of a generation, before the creatures move. Once per generation. |
| `STEP_END` | `population` | live creatures | End of every step. |
| `STEP_END` | `population_plant`, `population_attack_plant`, `population_attack_animal` | live creatures of that genus | Same. |
| `STEP_END` | `waterInCells`, `waterInCloud`, `waterInCreatures` | water in that part of the world | Same. |
| `STEP_END` | `waterTotal` | sum of the three | Same. |
| `GENERATION_END` | same 8 names as `STEP_END` | same values; the water after evaporation | Last step of a generation, after its `STEP_END` rows. |
| `GENERATION_END` | `survivors` | creatures chosen by the selection method, the parents of the next generation; `ParamValue2` is the same number as a percentage of **Initial population** (0 to 100, more if there are more survivors than Initial population) | Right after the other `GENERATION_END` rows, still in the generation that ends. Not written in continuous simulations, which have no selection. |

## One creature with every option on

This is what the log holds for a creature with **Step totals** on, every box in **Events to record** on, and **Creature to log** set to its id (or `0`).

### At birth

8 `INFO` rows `birth …`, then `BIRTH parentId` and `BIRTH genome`. Creatures of a new generation are born at step 1, before `GENERATION_START`; children are born in the middle of their parent's step (see Reproduction below), with their own id.

### Each step

The rows follow the order of `Creature.computeStep()`:

1. **Age.** If it is older than its maximum age: `DEAD` with `old`, then 8 `INFO` rows `dead …`, and nothing else this step.
2. **Basal metabolism.** `METABOLISM mass` and `METABOLISM basalConsumption` (steps multiple of 10). If it ran out of mass: `DEAD basalConsumption` + 8 `INFO dead …`, and the step ends.
3. **Brain.** The actions run in table order ([Sensors and actions](sensors-and-actions.md)). Movement actions write nothing here, they only add to the urge to move. The others:
   - **Photosynthesis** (output above 0, steps multiple of 10): `PHOTOSYNTHESIS actionInputValue`, `PHOTOSYNTHESIS waterGotFromCell`.
   - **Reproduction** (output above 0 and enough mass; otherwise nothing): `REPRODUCE_TRY mass`, then one of
     - no free cell nearby and nothing to eat: `REPRODUCE_TRY mass consumed`;
     - no free cell, but a neighbour it can eat: the prey's rows (`DEAD_ATTACKED`, `DEAD attacked`, 8 `INFO dead …`) and `ATTACK preyMass`, then the rows of a success;
     - success: the child's 8 `INFO birth …` rows and its `BIRTH parentId` (with this creature as parent) and `BIRTH genome` rows (child's id, only if the child passes the creature filter), then `REPRODUCE actionInputValue` and `REPRODUCE mass`.
   - **AttackPlant / AttackAnimal** (output above the threshold and a neighbour it can eat in N, E, S or W): `ATTACK_TRY actionInputValue`, `ATTACK_TRY targetDirection`; if it killed the prey, the prey's rows (`DEAD_ATTACKED`, `DEAD attacked`, 8 `INFO dead …`, with the prey's id and only if the prey passes the filter), then `ATTACK preyMass`. With both attack actions enabled, this can happen twice in a step.
4. **Cost of the actions.** `METABOLISM actionsExecutionConsumption` (steps multiple of 10). If it ran out of mass: `DEAD actionsExecutionConsumption` + 8 `INFO dead …`, and the step ends.
5. **Movement.** If the urge to move turns into a move: `MOVE_TRY x,y`, and, if the cell was free and it had the mass to move, `MOVE direction` and `MOVE position x + 100y`.

When the creature is killed by another one, its death rows appear inside the attacker's step (3, above).

### Example

Step 10 of generation 3 for creature 42, a plant that photosynthesises, tries to reproduce with no free cell around and moves east (`es-ES` locale, species and values made up):

```
CREATURE;10;3;10;#3fa2c8;plant;42;METABOLISM;mass;3,42;0;
CREATURE;10;3;10;#3fa2c8;plant;42;METABOLISM;basalConsumption;0,01;0;
CREATURE;10;3;10;#3fa2c8;plant;42;PHOTOSYNTHESIS;actionInputValue;0,74;0;
CREATURE;10;3;10;#3fa2c8;plant;42;PHOTOSYNTHESIS;waterGotFromCell;0,07;0;
CREATURE;10;3;10;#3fa2c8;plant;42;REPRODUCE_TRY;mass;3,48;0;
CREATURE;10;3;10;#3fa2c8;plant;42;REPRODUCE_TRY;mass consumed;0,1;0;
CREATURE;10;3;10;#3fa2c8;plant;42;METABOLISM;actionsExecutionConsumption;0,03;0;
CREATURE;10;3;10;#3fa2c8;plant;42;MOVE_TRY;x,y;1;0;
CREATURE;10;3;10;#3fa2c8;plant;42;MOVE;direction;1;0;E
CREATURE;10;3;10;#3fa2c8;plant;42;MOVE;position x + 100y;2.315;0;
```

The step totals of step 10 then follow, at the first event of step 11, mixed with the `WORLD EVENTS` rows of the end of step 10. On steps that are not multiples of 10 the `METABOLISM` and `PHOTOSYNTHESIS` rows are missing.

## Limitations

- `MOVE position x + 100y` packs the position in one number, which is ambiguous when `x` is 100 or more. The x and y of the position are in the `INFO … position` rows. The format is kept because the Power BI report reads it.
