# Settings and stats

Use **Settings** to change the rules of a simulation and **Stats** to see whether the change worked.

## Settings

![Settings tab](images/tab_settings.png)

The tab is grouped in sections: World, Generations, Neuronal networks, Mutations, Sensors, Actions and Water. Every field is described in the [parameters reference](../reference/parameters.md).

### Applying changes

Your edits are a **draft**. The simulation keeps running with its old settings until you apply them. When the draft differs from the running simulation, the bar at the top says "You have changes that are not applied yet" and offers three buttons:

| Button | Effect |
|---|---|
| **Update simulation** | Applies the changes and keeps the current creatures, generation number and stats. Use it to adjust a run that is in progress. |
| **Restart** | Applies the changes and starts again from generation 1. |
| **Discard changes** | Goes back to the settings of the running simulation. |

Some changes behave differently depending on how you apply them:

- **World size and map:** **Update simulation** rebuilds the world straight away. Creatures that no longer fit are removed: those outside a smaller world, or on a cell that is now an obstacle.
- **Initial population** and the population strategy take effect when the next generation is created. Choosing *Random Fixed Gene* or *Plant/Herbivore* also enables the actions their genera need (Photosynthesis, Attack Plant, Attack Animal, and Reproduction for all of them) and turns metabolism on, so use **Restart** after choosing them (see Sensors and actions below).
- **Simulation type:** with **Update simulation**, the current creatures carry on in the new mode, and the change takes effect at the end of the current generation. In continuous mode, Settings warns you if no creature can be born: metabolism is off, or the Reproduction action is not enabled.
- **Phenotype mode** only changes how creatures are coloured. **Update simulation** recolours them straight away.
- **Metabolism:** with **Update simulation**, the creatures keep their current mass and start gaining or losing it from the next step.
- **Simulation code:** **Update simulation** renames the running simulation. **Restart**, and the automatic restart after an extinction, keep a code you chose, also one applied earlier with **Update simulation**. They also keep the code when the seed is fixed and no setting has changed, because the restart repeats the same simulation. Otherwise they pick a new random one.
- **Fixed seed:** off, every **Restart** picks a new random seed. On, every **Restart** repeats the same simulation (same settings and map); change the number to get another one. Turning it on fills in the seed of the running simulation, and **Fix this seed** does the same later, so you can repeat a run you liked. The seed only takes effect with **Restart**: **Update simulation** keeps the current random sequence.
- **Sensors and actions:** genes point to sensors and actions by their position in the list of enabled items. If you change the list and click **Update simulation**, existing brains are rewired. Use **Restart** unless that is what you want.
- **Invalid values:** a field rejects a value out of range and shows the allowed range. When you leave the field, it goes back to the last valid value.

### Ideas to try

| Experiment | Change |
|---|---|
| Does evolution still work with fewer mutations? | Set Mutation probability to 0.001 and restart. |
| Do bigger brains solve harder maps? | Raise Max genome size to 16 and Max neurons to 4. |
| How much does a single sense matter? | Disable Horizontal Position and restart. |
| Reward travelling instead of a place | Selection method: Greatest Distance. |
| Harder goal | Make the reproduction area smaller in the [Map editor](map-editor.md). |

## Stats

![Stats tab](images/tab_stats.png)

The chart plots the **fitness value** of every generation. The selection method defines what fitness means, and the chart title changes with it:

| Selection method | Chart title | Meaning |
|---|---|---|
| Inside Reproduction Area | Survival rate (%) | Share of the population that survived |
| Greatest Distance | Distance index | Longest distance covered |
| Greatest Mass | Greatest mass | Heaviest herbivore |
| Reproduction | Reproduction | Number of survivors |
| *(continuous runs)* | Population | Creatures alive at the end of the generation. The births and deaths of the last generation are shown above the chart. |

**maxFitnessValue** above the chart is the value of the last generation. The curve is smoothed.

Below the chart, **Total time** is the time spent running the simulation, **Last generation duration** is how long the last generation took to compute, and **Steps per second** is how many steps were computed during the last second. Use it to compare the speed controls: the step counter of the control bar is redrawn at most once per frame, so it looks the same at very different speeds.

Typical shapes:

- **A long flat start, then a jump.** The population found a strategy by chance and it spread. In the screenshot, the jump is where the loaded run reached generation 5574.
- **A plateau below 100%.** The current brains have hit their limit. More genes or neurons, or more time, may help.
- **A sudden drop.** A change to the settings or the map made the old strategy useless.

### Water

Shows how the world's water is split between the cloud, the cells and the creatures. It only changes when metabolism is enabled. **Show water in cells** paints every empty cell of the world from grey (no water) to blue (full), by its water as a percentage of the cell's capacity. It is a viewer option: it is off when the app opens, it is not saved with the simulation, and it redraws the world at once, also while paused. Because it is drawn on the world canvas, GIFs recorded while it is on show the water too.

### Logger

The **logger** records the events of the simulation (births, moves, deaths, attacks…) and saves them as a `.csv` file. A Power BI report to analyse the log is in `public/analyze simlog.pbix`. Every recording starts with `SETUP` rows that list all the settings (sensors and actions as 1 or 0) and the constants of the simulation. What the file contains, row by row, is in [The log file](../reference/log-file.md).

**Enable logger**, at the top, turns the logger on or off (it is off by default). While it is off, the rest of the section is hidden. Turning it off stops it and deletes the log; when the log has events that have not been saved, it asks first. It is saved with the simulation.

**Recording** shows what the logger is doing:

- **Status**: *Stopped*, *Waiting for generation N to start* (a recording starts at step 1 of a generation; generation 1 needs **Restart**, and the status says so), *Recording generation N* (with *stops at its end* when it records one generation), *Stopped: the generation is recorded*, or *Stopped: the log reached Maximum events*.
- **Events logged**, out of **Maximum events**, with *(not saved)* when there are events that have not been saved.
- **Generations** and **Creatures** in the log.

To record, choose **From** (*Next generation*, or *Generation 1*, which waits for a **Restart**) and **For** (*One generation*, or *Until stopped*), and press **Start recording**. While the logger is recording or waiting, the button is **Stop log**. **From** and **For** are not saved with the simulation.

**Start recording** and **Delete log** delete the log; **Save log** downloads it. When the log has events that have not been saved, the first two ask first. **Save log** and **Delete log** are disabled while the log is empty.

**Creature to log** chooses the creatures whose events are written, one row per event: *No creatures (only totals)*, the default, *All creatures*, *Creatures 1 to 9*, *Creatures 1 to 29*, or *One creature*, which shows a **Creature id** field. The step and generation totals count these creatures, or every creature with *No creatures*. It is saved with the simulation (`LOG_CREATURE_ID`), and the logger reads it when a recording starts: a change during a recording is used from the next one, and a note says so. **Set as creature to log** in the Population tab sets it to the selected creature. When the selection method gives the ids again every generation, a note says that the id is a different creature in each generation.

A warning in red appears under **Creature to log** when the logger follows a single creature and it dies, with the generation and step of its death. No more events of it are logged. The warning goes away when a creature with that id is alive again, for example in the next generation of a method that restarts the ids.

**Logger options**, below, change the logger settings (the `LOG_*` constants). They apply at once, also while paused, and are saved with the simulation. Settings does not show them as pending changes, and **Update simulation** and **Restart** keep them.

- **Step totals** writes, for each step, how many times each creature event happened (default off, as the rows add up fast in long recordings). The generation totals and the world events are always written.
- **Maximum events** is the number of rows at which the logger stops.
- **Number format (locale)** sets the decimal separator of the values: `es-ES` (1,5) or `en-US` (1.5). A file saved with another locale keeps it, and it shows in the list.
- **Events to record** turns each event type on or off. A creature event that is off is not counted in the totals either.
