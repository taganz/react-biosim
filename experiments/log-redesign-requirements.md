# Rehacer el log — requisitos (borrador)

Estado: borrador para revisar antes de implementar. Las decisiones abiertas están al final (§8).

## 1. Situación actual

- El logger está en *Tools → Logger* (`components/simulation/tabs/tools/Logger*.tsx`) y el motor en `simulation/logger/EventLogger.ts`.
- Es un **log de eventos** en formato largo: una fila por evento (`BIRTH`, `MOVE`, `METABOLISM`…) con `ParamName` / `ParamValue`. Para saber el estado de una criatura hay que reconstruirlo sumando eventos. Lo lee el informe `public/analyze simlog.pbix`.
- Filtro de criaturas limitado: ninguna, todas, ids 1–9, ids 1–29 o un id. Los ids se reinician cada generación, así que un id solo no identifica a una criatura.
- `SpeciesId` es el **color hex del genoma**: no es único (dos genomas distintos pueden tener el mismo color) y no permite recuperar el genoma.
- Una especie es, en todo el código, el conjunto de criaturas con **exactamente el mismo genoma** (`Species.genomeKey = genome.toDecimalString()`).
- La selección en la UI es simple: `selectedCreatureAtom` (una criatura) y `selectedSpeciesAtom` (una especie). No hay selección múltiple.
- Muchas variables ya están calculadas y se ven en Population: `computeSpeciesStats()` y `creatureMassBalance()` en `simulation/generations/creatureQueries.ts`.

## 2. Objetivo

Un log nuevo, en la pantalla **Simulation**, que guarde **tablas de estado** (una fila por especie o por criatura, una columna por variable) en lugar de eventos sueltos, fácil de abrir en Excel / Power BI / pandas.

## 3. Requisitos funcionales

### R1. Ubicación
- Nueva sección plegable **Log** en la pestaña Simulation (`SimulationPanel.tsx`), con el mismo estilo que *Run*.
- *Tools → Logger* desaparece (ver §8, D1).

### R2. Nivel
- El usuario elige **Especies** o **Criaturas** (o ambos, un archivo cada uno).

### R3. Alcance
- **Todas**: todas las especies / criaturas vivas de la generación actual.
- **Seleccionadas**: las que el usuario ha marcado (ver R7).
- Opción: incluir también las criaturas **muertas** de la generación actual que el motor aún conoce.

### R4. Cuándo se guarda
- **Ahora**: un botón que guarda una instantánea del estado actual.
- **Grabación periódica**: añade una fila por entidad al final de cada generación (y opcionalmente cada N pasos) mientras está activa, y se descarga al pararla o con *Guardar*. (Ver D2.)

### R5. Identificador de especie
Una especie del log es un **linaje**: un genoma *y* la especie de la que salió. Un mismo genoma al que se llega por mutación desde dos especies padre distintas son dos especies.

- `speciesId` = hash de 64 bits (16 dígitos hex) de `genoma + parentSpeciesId`. Es determinista y no usa `random()`.
- Regla al nacer:
  - **Hijo con el mismo genoma que su padre** (sin mutación): hereda el `speciesId` del padre. Si no lo heredara, cada generación crearía una especie nueva.
  - **Hijo con genoma distinto** (mutación): `speciesId = hash(genoma, speciesId del padre)` y `parentSpeciesId = speciesId del padre`.
  - **Sin padre** (genoma aleatorio de la generación 1, relleno aleatorio, genoma fijo): `speciesId = hash(genoma, "root")` y `parentSpeciesId` vacío.
- Así cada especie tiene **una sola** especie padre, y el árbol se reconstruye directamente.
- Caso límite aceptado: si la misma especie padre produce el mismo genoma mutado dos veces por separado, las dos ramas comparten id, porque son indistinguibles.
- La criatura guarda su `speciesId` y su `parentSpeciesId` como campos propios, que se fijan al nacer y se guardan en el `.sim`. Los `.sim` antiguos se cargan como especies raíz.
- Siempre se guarda junto al **genoma** completo (en hex, el formato que se copia en el panel de especies).
- El color pasa a ser una columna aparte, solo informativa.
- La pestaña Population agrupa por `speciesId`, no por genoma, para que lo que se ve coincida con el log (D6).

### R6. Identificador de criatura
- `creatureKey = <birthGen>-<id>` (único en la ejecución), además de `id` y `birthGen` por separado, y `parentKey` del padre.

### R7. Selección múltiple
- En Population se puede **marcar** varias especies y varias criaturas (casilla o botón "añadir al log") además de la selección actual. La lista de marcadas se ve y se puede vaciar en la sección Log.
- Si una especie marcada se extingue o una criatura muere, se conserva en la lista (con estado "extinta" / "muerta").

### R8. Variables de criatura
| Grupo | Columnas |
|---|---|
| Contexto | `simCode`, `seed`, `generation`, `step` |
| Identidad | `creatureKey`, `id`, `birthGen`, `stepBirth`, `speciesId`, `genus`, `color`, `parentKey`, `parentSpeciesId`, `spawnZone` |
| Estado | `alive`, `age`, `mass`, `health`, `x`, `y`, `lastMoveX`, `lastMoveY`, `lastDirection`, `distanceCovered`, `stepsStopped`, `canMove`, `canReproduce` |
| Contadores | `children`, `kills`, `attacks`, `thinkCount`, `waterFromPhotosynthesis`, `waterFromPrey` |
| Balance de masa | `massStart`, `massPhotosynthesis`, `massFromPrey`, `massBasal`, `massThinking`, `massMoving`, `massAttacking`, `massReproductionCost`, `massGivenToChildren`, `massEnd` |
| Muerte | `deathCause`, `deathGen`, `deathStep`, `killedBySpecies` |
| Cerebro | `genomeSize`, `usedSensors`, `usedActions` (nombres separados por `|`) |
| Genoma | `genome` (opcional por criatura, porque ya está en el log de especies) |

### R9. Variables de especie
| Grupo | Columnas |
|---|---|
| Contexto | `simCode`, `seed`, `generation`, `step` |
| Identidad | `speciesId`, `parentSpeciesId`, `firstGen`, `genome`, `genomeSize`, `genus`, `color`, `usedSensors`, `usedActions` |
| Población | `alive` (criaturas vivas en ese momento), `percentOfPopulation` (de las vivas), `aliveCreatures` (opcional: lista de `creatureKey` vivas separadas por `|`), `started`, `bornSince`, `died`, `peakAlive` (máximo de vivas durante la generación) |
| Medias de vivas | `avgAge`, `avgMass`, `avgHealth`, `avgDistance`, `avgStepsStopped`, `pctCanMove`, `pctCanReproduce` |
| Medias por criatura | `avgChildren`, `avgKills`, `avgAttacks`, `avgPhotosynthesis`, `avgFromPrey`, medias del balance de masa |
| Muertes | `avgAgeAtDeath`, `pctDeathOld`, `pctDeathBasal`, `pctDeathAttacked`, `pctDeathHealth` |


**Especies que nacen y se extinguen entre dos grabaciones.** Si la grabación periódica escribiera solo las especies vivas al final de la generación, una especie que aparece y se extingue dentro de la generación no saldría en el log. Sus descendientes quedarían colgando de un `parentSpeciesId` desconocido. Por eso:
- el motor lleva un registro ligero de las **especies vistas en la generación** (id, padre, primera generación, máximo de vivas, nacidas y muertas), que se actualiza en cada nacimiento y muerte y se vacía al empezar la siguiente;
- al final de cada generación se escribe una fila por cada especie vista, también las que acaban con `alive = 0`;
- `firstGen` es la generación en que apareció la especie. Se guarda en el registro, que se conserva entre generaciones para las especies vivas y se guarda en el `.sim`.

### R10. Formato del archivo
- CSV, formato ancho (una fila por entidad y momento), cabecera en la primera línea.
- Separador `;` y números con el locale elegido (por defecto `es-ES`, como ahora), o `,` + punto decimal (configurable).
- Cada grabación o instantánea es un **log** con un nombre común `sim <code> log <genInicio>-<genFin>`, y se descarga como varios archivos con ese prefijo:
  - `sim <code> log 1-200 settings.csv`: ajustes y constantes de la simulación al empezar el log, una fila por ajuste (`name;value;text`), más la semilla, la fecha y la versión del formato;
  - `sim <code> log 1-200 species.csv`;
  - `sim <code> log 1-200 creatures.csv`.
  Una instantánea usa `log <gen>` (por ejemplo, `log 57`).
- Los CSV de datos tienen solo una cabecera y las filas.
- Si el navegador bloquea las descargas múltiples, se ofrece un `.zip` (D7).

### R11. Headless
- El runner (`npm run sim`) puede escribir los mismos CSV en `results/<name>/` (opciones en el config). El cálculo va en el motor (`simulation/`), sin React, para servir a los dos.

## 4. Requisitos no funcionales
- No consumir números aleatorios ni cambiar el orden de nada: una ejecución con semilla fija da el mismo resultado con el log activo o no (test de determinismo).
- Coste: la instantánea se calcula solo al guardar o al final de generación; con 1000 criaturas no debe notarse (< 50 ms).
- Memoria: la grabación periódica tiene un tope de filas, como `LOG_EVENTLOGGER_MAX_EVENTS`, y avisa al llegar.
- Tests en Jest para el id de especie (estable, mismo genoma → mismo id), las columnas y el formato.
- Documentación: nueva página `docs/reference/log-file.md` (sustituye la actual), `docs/user/settings-and-stats.md`, `docs/reference/parameters.md` para los ajustes nuevos, y `docs/known-issues.md`.

## 5. Ajustes nuevos (propuesta)
`LOG_ENABLED`, `LOG_LEVEL` (`species` | `creatures` | `both`), `LOG_SCOPE` (`all` | `selected`), `LOG_INCLUDE_DEAD`, `LOG_EVERY_N_STEPS` (0 = solo final de generación), `LOG_INCLUDE_CREATURE_GENOME`, `LOG_LOCALE_STRING`, `LOG_MAX_ROWS`. Los `.sim` antiguos con `LOG_CREATURE_ID`, `LOG_STEP_TOTALS` y `LOG_ALLOWED_EVENTS` se migran (o se ignoran).

## 6. Fuera de alcance (por ahora)
- Gráficas del log dentro de la app.
- Actualizar el informe Power BI.

## 7. Plan de implementación (tras aprobar)
1. `speciesId` desde el genoma + tests.
2. Funciones del motor que construyen las filas (reutilizando `computeSpeciesStats` y `creatureMassBalance`) + CSV + tests.
3. Grabación periódica en `WorldController` (final de generación / cada N pasos).
4. Selección múltiple en Population.
5. Sección Log en Simulation; quitar Tools → Logger.
6. Headless, migración de ajustes y documentación.

## 8. Decisiones
- **D1. Decidido:** el log de eventos actual (`EventLogger`, *Tools → Logger*, `Creature.log()`, `WorldController.log()`) **se elimina**. El `.pbix` deja de servir; se quita o se marca como obsoleto.
- **D2. Decidido:** **ambas**, instantánea con botón y grabación periódica (final de generación, opcionalmente cada N pasos).
- **D3. Decidido:** la configuración va en un `settings.csv` aparte, con el mismo prefijo que el log (R10).
- **D4. Decidido, revisado:** la especie es un linaje, y su id sale del genoma y de la especie padre (R5). Hace falta un registro ligero de especies en el motor (R9), que se guarda en el `.sim`.
- **D5. Decidido:** selección múltiple en Population (R7).
- **D6. Decidido:** Population agrupa las especies por `speciesId` en lugar de por genoma. Esto afecta a todo lo que hoy compara genomas para formar una especie: `PopulationPanel` (`genomeKey`), `computeSpeciesStats`, `speciesMembers`, `selectedSpeciesAtom`, el color del anillo y la búsqueda al hacer clic en el mundo. El panel de especie muestra también el `speciesId` y el de su especie padre, con un botón para seleccionar la especie padre si sigue viva. La documentación de `docs/user/population-and-brains.md` se actualiza.
- **D7. Propuesta:** guardar varios archivos sueltos y, si da problemas, un `.zip`.

## 9. Gráficos que se podrán sacar del log

### Árbol de especies en el tiempo
Una línea por especie a lo largo de las generaciones, con un grosor proporcional a sus criaturas vivas, que sale de la línea de su especie padre.

**Se puede, con el log de especies grabado al final de cada generación y alcance "Todas":**
| Lo que necesita el gráfico | Columna |
|---|---|
| Eje X | `generation` |
| Una línea por especie | `speciesId` |
| Grosor | `alive` (vivas al final de la generación) o `peakAlive` |
| De qué rama sale | `parentSpeciesId`, que es único gracias a R5 |
| Dónde empieza | `firstGen`, o la primera fila de la especie |
| Dónde acaba | la última fila con `alive > 0` |

Condiciones y avisos:
- **Alcance "Todas".** Con "Seleccionadas" faltan ramas intermedias y el árbol queda roto.
- **Hay que grabar desde la generación 1**, o desde el principio del tramo que quieras ver. Las especies que ya existían al empezar el log aparecen como raíces sin padre conocido. Su `parentSpeciesId` está, pero sin fila.
- **Cantidad.** Cada mutación crea una especie, así que habrá miles de especies efímeras de 1 o 2 criaturas. Para que el gráfico se lea habrá que filtrar al dibujarlo: por ejemplo, especies con `peakAlive ≥ N`, o colapsar las ramas pequeñas en su padre. Para eso el filtro debe poder subir por `parentSpeciesId` hasta el antepasado visible más cercano, y los datos lo permiten.
- **Herramienta.** Power BI no tiene este tipo de gráfico (un árbol en el tiempo, tipo *Muller plot* o *fishplot*). Se dibuja bien con Python (matplotlib/plotly) o con una página HTML. Puedo preparar un script `experiments/` que lea `species.csv` y lo dibuje.
- En simulaciones continuas no hay final de generación. Se usa la grabación cada N pasos, con `step` como eje X.
