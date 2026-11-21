# Herbívoros que buscan comida: conclusiones y propuestas

Resumen del trabajo del 20–21 de noviembre de 2026. Objetivo: encontrar una configuración en la que surjan herbívoros que se desplacen buscando comida.

## 1. Punto de partida: por qué hoy no aparecen

En la ejecución continua `results/prova261110b` (de `sim 1101_4 generation 530`), con ~300 herbívoros y ~5.500 plantas, **ningún herbívoro se mueve**: son emboscadores (`VerticalBorderDistance → Reproduction`, `N0 → AttackPlant`). Causas:

1. **Moverse es carísimo**: (`MOVE_COST_PER_MASS_TRY` 0.2 + `MOVE_COST_PER_MASS_DO` 0.6) × masa al nacer 3 = **2,4 por paso**, más de lo que da una planta.
2. **No pueden orientarse**: tenían `PreyNorth/East/South/West` pero no `MoveNorth/South/East/West`, solo `RandomMove` y `MoveForward`.
3. **Las plantas crecidas no se pueden comer**: con `ATTACK_MIN_PREY_MASS_FACTOR` = 2, un herbívoro de 3 solo come plantas de ≤ 1,5.
4. **La comida llega sola**: las plantas se reproducen en las 8 casillas vecinas, y la lluvia `rainTypeSinSin` es un patrón fijo.
5. Un cerebro perseguidor (~6 genes) costaba 0,66 por paso con `MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE` = 0.11.

## 2. Fase 1 (generacional): funciona

**Plant/Herbivore** + **Greatest Mass**: las plantas (80 %) se recrean cada generación en posiciones aleatorias y se selecciona al 5 % de herbívoros más pesado. Configuración en [forage-pilot.json](forage-pilot.json):

- Acciones: las 6 de movimiento, Photosynthesis y AttackPlant. **Sin Reproduction** (ver trampa B).
- Sensores: posición, edad, oscilador, aleatorio, velocidades, distancias al borde y `PreyN/E/S/W`. Sin `PreyDistance`, que vale 999999 sin presa y satura la red.
- `MASS_WATER_TO_MASS_PER_STEP` 0.25, `MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE` 0.005, `MASS_MAX_MULTIPLE_MASS_AT_BIRT` 10, `ATTACK_MIN_PREY_MASS_FACTOR` 0.1, `ATTACK_SAME_GENUS` false.
- Genoma de 6 a 12 genes, 2 neuronas, 2000 criaturas, 300 pasos por generación.
- Fotosíntesis anulada en los no-plantas **desde el script** (ver trampa A).

**Resultados a 300 generaciones** (coste de moverse TRY/DO):

| Mundo | Coste | Semilla | Resultado |
|---|---|---|---|
| 100×100 (plantas en el 16 % de las casillas) | 0.003/0.007 | 1 | **Persecución** (`PreySouth → MoveSouth`, `PreyNorth → MoveNorth`) |
| 100×100 | 0.003/0.007 | 2 | Paseo aleatorio (`Oscillator → RandomMove`, `MoveForward`) |
| 100×100 | 0.01/0.03 | 1 | Línea recta hacia el oeste |
| 100×100 | 0.01/0.03 | 2 | Deriva, sin persecución |
| 100×100 | 0.2/0.6 (actual) | 1 y 2 | Se extinguen en la generación 1 |
| **200×200 (4 %)** | 0.003/0.007 | 1 | **Patrulla y persigue**: `Oscillator → MoveSouth` + `PreyNorth → MoveNorth` |
| 200×200 | 0.003/0.007 | 2 | Línea recta (`HorizontalSpeed → MoveForward`) |
| **200×200** | **0.01/0.03** | **1** | **Persecución en dos ejes**: `PreyNorth → MoveNorth` + `PreyEast → MoveEast` (el mejor ejemplo) |
| 200×200 | 0.01/0.03 | 2 | Persecución débil + deriva |

**Conclusiones**: el coste de moverse decide si se mueven, y la **dispersión de la comida** decide si persiguen: 1 de 4 ejecuciones con comida densa y 3 de 4 con comida dispersa. Los genomas se encogen hasta 2–5 genes.

## 3. Fase 2 (continua): falla con el motor actual

Empecé con los cazadores de `forage1b-mid-s1` (con un gen `Oscillator → Reproduction` añadido y los genes renumerados, porque activar Reproduction desplaza las acciones) y 2000 plantas `Random → Photosynthesis` + `Random → Reproduction`. Mundo de 100×100, hasta 100 generaciones.

| Prueba | Resultado |
|---|---|
| Ajustes de la fase 1 | Los herbívoros se disparan; persecución del 100 % al 1 % en 5 generaciones |
| + coste por gen 0.03 (3 variantes) | Plantas y herbívoros en equilibrio, persecución al 0 %. Ganan **herbívoros nacidos de plantas mutantes** |
| + género fijo en las mutaciones | Ganan **descendientes de los cazadores sin sus genes de movimiento** (`Oscillator → AttackPlant` + `Oscillator → Reproduction`) |
| + sin "comer al vecino para hacer sitio" | Igual: sedentarios |
| Genes baratos (0.005), lluvia 30/10/5 | Los cazadores arrasan las plantas y todo se extingue en la generación 2–3 |

**Por qué falla**: quedarse quieto sale casi gratis.
- El mantenimiento solo depende de los genes: un sedentario de 2 genes paga 0,04 por paso. Subir el coste por gen castiga más al cazador, que necesita más genes.
- Las plantas brotan junto al herbívoro quieto.
- Comer tiene una eficiencia del 100 %: con movimiento barato, los cazadores se multiplican hasta arrasar las plantas.

En la fase 1 funcionó porque la comida reaparecía al azar cada generación y nunca "llegaba" al herbívoro.

## 4. Trampas del modelo descubiertas

- **A. Cualquier género puede hacer fotosíntesis.** Un herbívoro con ese gen crece sin comer. En la fase 1 el 99,9 % lo adquirió en una generación.
- **B. Plantas que se convierten en herbívoros.** Una sola mutación de `Random → Photosynthesis` a `X → AttackPlant` crea un herbívoro de 2 genes en medio de sus parientes.
- **C. "Comer al vecino para hacer sitio".** Al reproducirse sin casilla libre, el herbívoro se come una planta vecina: come y se expande sin moverse.
- **D. Costes escalados con la masa al nacer.** Moverse y reproducirse cuestan 3 veces más a un herbívoro que a una planta, y 6 veces más a un carnívoro.

## 5. Qué caracteriza a cada género hoy

El género sale de las acciones del genoma (AttackAnimal > AttackPlant > Photosynthesis) y es fijo al nacer. Solo determina:
1. la masa al nacer (1 / 3 / 6), y con ella la masa máxima y los costes de moverse y reproducirse;
2. qué puede comer (solo los atacantes comen; no comen a su género salvo con `ATTACK_SAME_GENUS`; hay un límite de masa de la presa);
3. qué buscan sus sensores de presa;
4. si puede comerse a un vecino para hacer sitio;
5. qué genes cuentan como primarios (en plantas, Photosynthesis y Reproduction; en el resto, Reproduction);
6. el color.

**No** limita acciones ni sensores: las listas de "géneros compatibles" solo se usan al construir genomas en Random Fixed Genera y Plant/Herbivore.

## 6. Propuestas para el motor (pendientes de implementar)

Las cuatro opciones tienen valores por defecto que mantienen el comportamiento actual.

| Opción | Por defecto | Para la fase 2 | Qué hace |
|---|---|---|---|
| `MASS_BASAL_CONSUMPTION_PER_MASS` | 0 | 0.005 | Coste por paso proporcional a la masa **actual**, que va a la nube. Esperar con el cuerpo lleno sale caro, y afecta más a herbívoros y carnívoros. Un coste fijo por criatura sería casi igual al primario que ya existe. |
| `ATTACK_MASS_EFFICIENCY` | 1 | 0.3–0.5 | Parte de la masa de la presa que gana el atacante. El resto va **a la nube** (respiración), no a la casilla, que regaría las plantas junto al sedentario. |
| `PHOTOSYNTHESIS_FACTOR_NON_PLANTS` | 1 | 0 | Factor de 0 a 1 para la fotosíntesis de los no-plantas. 0 = solo plantas; los valores intermedios dan mixótrofos. |
| `REPRODUCTION_EAT_TO_MAKE_ROOM` | true | false | En false, sin casilla libre no nace el hijo y el padre pierde `REPRODUCTION_COST_PER_MASS_TRY` × masa al nacer (0,3 para un herbívoro), como ya les pasa hoy a las plantas ([CreaturerReproduction.ts:24](../simulation/creature/CreaturerReproduction.ts)). |

Además, "mutaciones que no cambian el género" se queda por ahora en el script de experimentos, porque interviene más directamente en la evolución.

Cada opción nueva necesita: un campo en `WorldControllerData`, el valor por defecto en `startupScenario.ts`, el tratamiento de los archivos guardados sin ella, documentación en `docs/reference/parameters.md` y `docs/model/creatures.md`, y tests.

**Siguiente paso**: implementar las cuatro opciones y repetir la fase 2 con `MASS_BASAL_CONSUMPTION_PER_MASS` y `ATTACK_MASS_EFFICIENCY`. Si los cazadores siguen perdiendo, la siguiente palanca sería una lluvia que se desplace con el tiempo (código nuevo).

## 7. Herramientas y archivos

Todo esto está sin confirmar en git.

- [forage-pilot.ts](forage-pilot.ts): `npx tsx experiments/forage-pilot.ts <nombre> <semilla> <moveTry> <moveDo> [generaciones]`. Escribe `results/<nombre>/forage.csv` (tasa de movimiento, comedores, masa, % de genes de persecución, % de genes de fotosíntesis…), `generations.csv`, `setup.sim` y `final.sim`. Variables de entorno:
  - `WORLD_SIZE=200`: cambia el tamaño del mundo;
  - `BASE_SIM=<archivo.sim>`: parte de ese archivo con sus `startGenomes` (fase 2);
  - `EXTRA='{"worldControllerData":{...}}'`: más ajustes encima;
  - `PLANTS_ONLY_PHOTOSYNTHESIS=0`: desactiva el bloqueo de la fotosíntesis (activo por defecto);
  - `FIXED_GENUS=1`: las mutaciones no cambian el género (necesita `BASE_SIM`);
  - `NO_EAT_FOR_OFFSPRING=1`: sin comer al vecino para hacer sitio.
- [forage-phase2-build.ts](forage-phase2-build.ts): `npx tsx experiments/forage-phase2-build.ts <final.sim de la fase 1> <salida.sim> <lluvia>`. Crea el archivo de inicio de la fase 2.
- [forage-pilot.json](forage-pilot.json): ajustes de la fase 1.
- Resultados en `results/`:
  - `forage-*`: fase 1 en 100×100;
  - `forage1b-*`: fase 1 en 200×200 (`forage1b-mid-s1/final.sim` = los cazadores de dos ejes);
  - `phase2/start-rain*.sim`: archivos de inicio de la fase 2;
  - `p2t-*`: fase 2, variantes iniciales;
  - `p2f-*`: género fijo;
  - `p2n-*`: sin comer para hacer sitio;
  - `p2r-*`: niveles de lluvia.
- Para ver los resultados en la app, carga `setup.sim` o `final.sim` con *Load .sim file*. La app **no** bloquea la fotosíntesis de los herbívoros, así que no reproduce exactamente el piloto.
