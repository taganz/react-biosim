# The log file

The event logger records what happens during a run and saves it as a CSV file. This page describes the file: its columns, the four kinds of rows, every event the engine writes, and the exact rows of one creature when every option is on. How to use the logger from the UI is in [Settings and stats](../user/settings-and-stats.md#under-development-logger). The code is in [EventLogger.ts](../../simulation/logger/EventLogger.ts) and [LogEvent.ts](../../simulation/logger/LogEvent.ts).

## The file

**Save log** (*Stats → Under development*) downloads `simlog <generation>.csv`, where `<generation>` is the current generation. It is plain UTF-8 text:

- The separator is `;`.
- The first line is the header.
- Numbers are formatted with the locale in **Number format (locale)** (`LOG_LOCALE_STRING`, default `es-ES`), with at most 2 decimals. With `es-ES` the decimal separator is a comma and numbers of 5 digits or more get a dot as thousands separator (`12.345,67`).
- The log is kept in memory until **Delete log**. Recording again with one of the *Record…* buttons deletes it first; **Resume log** and **Log this creature** add to it.

A Power BI report to analyse it is in `public/analyze simlog.pbix`.

## Columns

| Column | Content |
|---|---|
| `LogLevel` | The kind of row: `CREATURE`, `STEP TOTALS`, `GENERATION TOTALS` or `WORLD EVENTS` (see below). |
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
| `ParamString` | A text value (direction, death cause, killer species). Empty when not used. |

## Kinds of rows

| `LogLevel` | Written by | One row per… |
|---|---|---|
| `CREATURE` | `Creature.log()` | creature event |
| `STEP TOTALS` | the logger | event type and `ParamName` that happened in a step |
| `GENERATION TOTALS` | the logger | event type and `ParamName` that happened in a generation |
| `WORLD EVENTS` | `WorldController.log()` | population and water value at the start of a generation, at the end of a step and at the end of a generation |

**Level** (`LOG_LEVEL`) chooses which kinds are written. Each level writes its own rows and the ones below it in this list:

| Level | Creature | Step totals | Generation totals | World events |
|---|:-:|:-:|:-:|:-:|
| *Creature events and all totals* (`CREATURE`) | ✓ | ✓ | ✓ | ✓ |
| *Step totals…* (`STEP`, default) | | ✓ | ✓ | ✓ |
| *Generation totals…* (`GENERATION`) | | | ✓ | ✓ |
| *World events only* (`WORLD`) | | | | ✓ |

### Totals

A totals row **counts** events, it does not add their values: `METABOLISM;mass sum;37` means that 37 `METABOLISM` rows with `ParamName` `mass` happened in that step, whatever the masses were. Only creature events are counted, and only those that pass the creature filter and are switched on in **Events to record**, even when the level does not write creature rows.

The totals of a step are written when the first event of the next step arrives, with the generation and step they belong to. The totals of a generation are written in the same way, after the step totals of its last step.

### Filters

An event is written only if all of these hold:

1. The logger is enabled (`LOG_ENABLED`) and recording, and has fewer rows than **Maximum events** (`LOG_EVENTLOGGER_MAX_EVENTS`). When it reaches the maximum it pauses.
2. Its event type is on in **Events to record** (`LOG_ALLOWED_EVENTS`).
3. For creature events, the creature passes **Creature to log** (`LOG_CREATURE_ID`): `0` is every creature, `-10` ids 1 to 9, `-30` ids 1 to 29, any other number that id only.
4. Its kind is written at the current level (totals still count the creature events that pass 1–3).

Recording starts at step 1 of a generation: the *Record…* buttons wait for step 1 of the first or the next generation, and **Resume log** and **Log this creature** for the next step 1. Events before that are dropped.

To save work, `METABOLISM` events and the `PHOTOSYNTHESIS` events are only written on steps that are multiples of 10 (10, 20, 30…). All other events are written on every step.

## Events

### Creature events

| `EventType` | `ParamName` | `ParamValue` | `ParamValue2` | `ParamString` | When |
|---|---|---|---|---|---|
| `INFO` | `birth mass`, `birth gen`, … | see [INFO rows](#info-rows) | | | The creature is created. |
| `INFO` | `dead mass`, `dead gen`, … | see [INFO rows](#info-rows) | | | The creature dies, after `DEAD`. |
| `INFO` | ` mass`, ` gen`, … (leading space) | see [INFO rows](#info-rows) | | | **Log this creature** is pressed. Only kept if the simulation is at step 1 (see [Filters](#filters)). |
| `METABOLISM` | `mass` | mass after the basal consumption | | | Every step (multiples of 10). |
| `METABOLISM` | `basalConsumption` | mass spent on basal metabolism | | | Every step (multiples of 10). |
| `METABOLISM` | `actionsExecutionConsumption` | mass spent on the actions of the brain | | | Every step (multiples of 10). |
| `PHOTOSYNTHESIS` | `actionInputValue` | output of the Photosynthesis neuron | | | The neuron output is above 0 (multiples of 10). |
| `PHOTOSYNTHESIS` | `waterGotFromCell` | water taken from the cell | | | Same. |
| `REPRODUCE_TRY` | `mass` | mass of the creature | | | The Reproduction neuron output is above 0. |
| `REPRODUCE_TRY` | `mass consumed` | mass spent on the failed try | | | Not enough mass to reproduce. |
| `REPRODUCE` | `actionInputValue` | output of the Reproduction neuron | | | The child was born. |
| `REPRODUCE` | `mass` | mass of the parent after giving birth | | | Same. |
| `ATTACK_TRY` | `actionInputValue` | output of the attack neuron | | | An attack neuron fires and there is a neighbour. Written even when the creature lacks the mass to attack. |
| `ATTACK_TRY` | `targetDirection` | `0` | `0` | `N`, `E`, `S` or `W` | Same. |
| `ATTACK` | `preyMass` | mass the prey had before it was eaten | | | The prey was killed. |
| `MOVE_TRY` | `x,y` | x step: −1, 0 or 1 | y step: −1, 0 or 1 | | The creature tries to move. |
| `MOVE` | `direction` | x step | y step | `N`, `NE`, `E`, `SE`, `S`, `SW`, `W` or `NW` | The move succeeded. `N` is +y. |
| `MOVE` | `position x + 100y` | `x + 100 × y` of the position after the try | | | After every move try, **also when the move failed**. |
| `DEAD_ATTACKED` | `killerSpecie` | x of the position | y of the position | species of the killer | The creature is killed by an attack. |
| `DEAD` | `cause` | `0` | `0` | `old`, `basalConsumption`, `actionsExecutionConsumption`, `attacked`, `health` or `unknown` | The creature dies. |

`BIRTH` is in **Events to record** but the engine never writes it: births are the `INFO` rows with `birth`.

### INFO rows

`INFO` always comes as a block of 8 rows. `<when>` is `birth`, `dead`, or empty for **Log this creature**:

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
| `GENERATION_START` | `population` | live creatures | Step 1 of a generation, before the creatures move. |
| `STEP_END` | `population` | live creatures | End of every step. |
| `STEP_END` | `population_plant`, `population_attack_plant`, `population_attack_animal` | live creatures of that genus | Same. |
| `STEP_END` | `waterInCells`, `waterInCloud`, `waterInCreatures` | water in that part of the world | Same. |
| `STEP_END` | `waterTotal` | sum of the three | Same. |
| `GENERATION_END` | same 8 names as `STEP_END` | same values; the water after evaporation | Last step of a generation, after its `STEP_END` rows. |

## One creature with every option on

This is what the log holds for a creature with **Level** at *Creature events and all totals*, every box in **Events to record** on, and **Creature to log** set to its id (or `0`).

### At birth

8 `INFO` rows `birth …`. Creatures of a new generation are born at step 1, before `GENERATION_START`; children are born in the middle of their parent's step (see Reproduction below), with their own id.

### Each step

The rows follow the order of `Creature.computeStep()`:

1. **Age.** If it is older than its maximum age: `DEAD` with `old`, then 8 `INFO` rows `dead …`, and nothing else this step.
2. **Basal metabolism.** `METABOLISM mass` and `METABOLISM basalConsumption` (steps multiple of 10). If it ran out of mass: `DEAD basalConsumption` + 8 `INFO dead …`, and the step ends.
3. **Brain.** The actions run in table order ([Sensors and actions](sensors-and-actions.md)). Movement actions write nothing here, they only add to the urge to move. The others:
   - **Photosynthesis** (output above 0, steps multiple of 10): `PHOTOSYNTHESIS actionInputValue`, `PHOTOSYNTHESIS waterGotFromCell`.
   - **Reproduction** (output above 0): `REPRODUCE_TRY mass`, then one of
     - not enough mass: `REPRODUCE_TRY mass consumed`;
     - no free cell nearby: nothing else;
     - success: the child's 8 `INFO birth …` rows (child's id, only if the child passes the creature filter), then `REPRODUCE actionInputValue` and `REPRODUCE mass`.
   - **AttackPlant / AttackAnimal** (output above the threshold and a neighbour in N, E, S or W): `ATTACK_TRY actionInputValue`, `ATTACK_TRY targetDirection`; if it killed the prey, the prey's rows (`DEAD_ATTACKED`, `DEAD attacked`, 8 `INFO dead …`, with the prey's id and only if the prey passes the filter), then `ATTACK preyMass`. With both attack actions enabled, this can happen twice in a step.
4. **Cost of the actions.** `METABOLISM actionsExecutionConsumption` (steps multiple of 10). If it ran out of mass: `DEAD actionsExecutionConsumption` + 8 `INFO dead …`, and the step ends.
5. **Movement.** If the urge to move turns into a move: `MOVE_TRY x,y`; `MOVE direction` if the cell was free and it had the mass to move; and always `MOVE position x + 100y`.

When the creature is killed by another one, its death rows appear inside the attacker's step (3, above).

### Example

Step 10 of generation 3 for creature 42, a plant that photosynthesises, tries to reproduce without enough mass and moves east (`es-ES` locale, species and values made up):

```
CREATURE;10;3;10;#3fa2c8;plant;42;METABOLISM;mass;1,82;0;
CREATURE;10;3;10;#3fa2c8;plant;42;METABOLISM;basalConsumption;0,01;0;
CREATURE;10;3;10;#3fa2c8;plant;42;PHOTOSYNTHESIS;actionInputValue;0,74;0;
CREATURE;10;3;10;#3fa2c8;plant;42;PHOTOSYNTHESIS;waterGotFromCell;0,07;0;
CREATURE;10;3;10;#3fa2c8;plant;42;REPRODUCE_TRY;mass;1,88;0;
CREATURE;10;3;10;#3fa2c8;plant;42;REPRODUCE_TRY;mass consumed;0,02;0;
CREATURE;10;3;10;#3fa2c8;plant;42;METABOLISM;actionsExecutionConsumption;0,03;0;
CREATURE;10;3;10;#3fa2c8;plant;42;MOVE_TRY;x,y;1;0;
CREATURE;10;3;10;#3fa2c8;plant;42;MOVE;direction;1;0;E
CREATURE;10;3;10;#3fa2c8;plant;42;MOVE;position x + 100y;2.315;0;
```

The step totals of step 10 then follow, at the first event of step 11, mixed with the `WORLD EVENTS` rows of the end of step 10. On steps that are not multiples of 10 the `METABOLISM` and `PHOTOSYNTHESIS` rows are missing.

## Known issues

- **Totals of events with `_` in the name are mislabelled.** The logger joins event type and `ParamName` with `_` and splits them again, so `REPRODUCE_TRY` totals come out as `REPRODUCE;TRY sum`, `ATTACK_TRY` as `ATTACK;TRY sum`, `MOVE_TRY` as `MOVE;TRY sum` and `DEAD_ATTACKED` as `DEAD;ATTACKED sum`; different `ParamName`s of those events end up with the same label. `INFO … _energyConsumedByActionsExecution` totals lose their `ParamName`. The counts themselves are right.
- **`GENERATION_START` is written twice** from generation 2 on: once when the generation is created and once when its step 1 runs.
- **`BIRTH` is never written.** Its box in **Events to record** has no effect.
- **`MOVE position x + 100y` is written for failed moves too**, so it does not mean that the creature moved. The position is ambiguous when `x` is 100 or more.
