# Plan: simplificar las constantes del metabolismo

Estado al escribirlo (2026-11-27): hay un cambio sin commitear que quita el género carnívoro
(`attack_animal`), fusiona AttackPlant/AttackAnimal en `Attack` y sube el formato de guardado a la
versión 3. Ese cambio ya elimina `MASS_AT_BIRTH_ATTACK_ANIMAL` y la fila `attack_animal` de
`ASSIMILATION_EFFICIENCY`. Este plan parte de ahí.

## Paso 0. Cerrar lo pendiente

- [ ] Terminar y commitear la eliminación del carnívoro (`npx tsc --noEmit`, `npm test`, `npm run lint`).
- [ ] Guardar una referencia: 2-3 ejecuciones con semilla fija del runner (`npm run sim -- ... --seed N`)
      con metabolismo activo, para comparar después (ver la memoria *Determinism checks*).

## Fase 1. Eliminar constantes muertas (no cambia el comportamiento)

| Constante | Por qué |
|---|---|
| `MASS_AT_BIRTH_ATTACK` | Género "attack" antiguo; no se lee. |
| `ACTION_REPRODUCTION_OFFSET` | No se usa. La migración que la lee para `ACTION_ATTACK_OFFSET` se queda. |
| `ASSIMILATION_EFFICIENCY.plant.prey` | Las plantas nunca comen. |

Tocar: `WorldControllerData.ts`, `startupScenario.ts`, `ScenarioConstants.tsx`, nueva
`fromVersion3()` en `migrateSavedSimulationData.ts` (descarta las claves), tests de migración,
`docs/reference/parameters.md`.

Comprobación: las ejecuciones con semilla dan exactamente lo mismo.

## Fase 2. Fusionar constantes que hacen lo mismo

### 2a. Movimiento: `MOVE_COST_PER_MASS_TRY` + `MOVE_COST_PER_MASS_DO` → `MOVE_COST`

- Las dos se pagan siempre, antes de mirar si la casilla está libre (`Creature.move()`).
- Migración: `MOVE_COST = TRY + DO` (0,2 + 0,6 = 0,8).
- El umbral pasa a `MOVE_MULTIPLE_MASS_AT_BIRTH + MOVE_COST`. Hoy solo suma `DO`, así que una
  criatura con 0,6-0,8 × masa al nacer puede morir al moverse. **Cambio de comportamiento pequeño**:
  anotarlo en `docs/known-issues.md` como corregido.

### 2b. Ataque en múltiplos de la masa al nacer

- `ATTACK_COST_PER_MASS_TRY` es absoluto (0,02), aunque su nombre diga "PER_MASS". Moverse y
  reproducirse usan múltiplos de la masa al nacer.
- Sin carnívoros solo ataca un género, así que el cambio se puede migrar sin alterar el balance:
  `ATTACK_COST = ATTACK_COST_PER_MASS_TRY / MASS_AT_BIRTH_ATTACK_PLANT` (0,02 / 3 ≈ 0,0067).
- Eliminar `ATTACK_COST_PER_MASS_DO` (vale 0). Si se quiere que matar cueste, bajar `prey` en
  `ASSIMILATION_EFFICIENCY`. Migración: si un fichero lo tiene ≠ 0, sumarlo a `ATTACK_COST`
  (aviso: entonces se paga también al fallar) o dejarlo como clave opcional. Decidir al hacerlo.
- Mantener la regla "más ligero que el coste muere al intentarlo", o añadir el mismo umbral que el
  movimiento. Decidir.

### 2c. Coste del cerebro: quitar los valores generales por sensor/acción

- `MASS_COST_PER_SENSOR` y `MASS_COST_PER_ACTION` (ambos 0) solo son el valor por defecto de
  `SENSOR_COSTS` / `ACTION_COSTS`.
- Migración: copiar el valor general a cada sensor/acción habilitado que no tenga uno propio.
- Tocar: `CreatureBrain.ts` (`thinkCost`), `ScenarioSettings.tsx` (las filas ya muestran el coste).
- Opcional, más adelante: valorar si el coste por gen (`MASS_BASAL_CONSUMPTION_PER_BRAIN_*`) y el
  coste por conexión sobran juntos. No hacerlo sin experimentos.

### No fusionar

- `REPRODUCTION_COST_PER_MASS_TRY` / `_DO`: se pagan en casos distintos (fallo y éxito).
- `MASS_WATER_TO_MASS_PER_STEP` y la eficiencia de fotosíntesis: dan el mismo crecimiento, pero la
  primera decide cuánta agua sale de la celda.

Comprobación: tests de cada fusión, ejecuciones con semilla. 2b y 2c deben dar lo mismo salvo
redondeo; 2a cambia solo el caso de muerte al moverse.

## Fase 3. Agrupar (opcional, más trabajo)

```ts
GENUS: {
  plant:        { massAtBirth: 1, photosynthesis: 1 },
  attack_plant: { massAtBirth: 3, photosynthesis: 1, prey: 1 },
},
MASS_MAX_MULTIPLE: 5,          // corrige la errata "BIRT"
BRAIN:        { perGene: 0.04, perPrimaryGene: 0.01, sensors: {}, actions: {} },
STAMINA:      { default: 1, min: 0.05, mutationStep: 0.05 },
MOVE:         { minMass: 0, cost: 0.8 },
REPRODUCTION: { minMass: 3, costFail: 0.1, costSuccess: 0.25, maxDistancePercent: 4 },
ATTACK:       { cost: 0.0067, minPreyMassFactor: 2, sameGenus: false, offset: 0.6 },
```

Afecta a: `WorldControllerData`, todos los lectores en `simulation/creature/`, la sección Constants
(una subsección por grupo), `--set path=value` del runner (cambian las rutas: documentarlo en
`docs/user/headless-runner.md`), la Energy Lab (`public/energy-lab.html`, `experiments/energy-lab.html`),
los JSON de `experiments/` y una migración más.

## Al final de cada fase

- [ ] `npx tsc --noEmit`, `npm test`, `npm run lint` sin errores.
- [ ] Cargar algún `.sim` de `public/` en la app y comprobar que funciona.
- [ ] Documentación: `docs/reference/parameters.md`, `docs/model/creatures.md`,
      `docs/development/serialization.md` (versión de formato), `docs/known-issues.md`.
- [ ] Un commit por fase.
