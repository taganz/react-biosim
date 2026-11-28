/*
 * Informe de un log: por qué unas especies tienen más éxito que otras y qué parámetros frenan
 * la complejidad.
 *
 *   npx tsx experiments/analyze-log.ts <carpeta | fichero species.csv> [opciones]
 *
 * Lee los ficheros del log (settings, species y, si está, creatures) y escribe junto a ellos:
 *   - report.html           el informe (o el nombre de --out)
 *   - species-summary.csv   una fila por especie con sus totales y su circuito descodificado
 *
 * Entrada:
 *   - una carpeta del runner (log-settings.csv, log-species.csv, log-creatures.csv, final.sim);
 *   - o un fichero de la app ("sim X log 1-200 species.csv"); los demás se buscan con el mismo nombre.
 *
 * Opciones:
 *   --run <n|código>  ejecución a analizar cuando hay varias (tras extinciones). Por defecto, la más larga
 *   --min-peak <n>    pico mínimo de creaturas para que una especie cuente como relevante (5)
 *   --out <fichero>   nombre del informe (report.html)
 *
 * Las métricas, umbrales y limitaciones están explicados en el propio informe.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

// ---------- argumentos ----------

const argv = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const positional = argv.filter((arg, i) => !arg.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--")));
if (positional.length === 0) {
  console.error("Uso: npx tsx experiments/analyze-log.ts <carpeta | fichero species.csv> [--run n] [--min-peak 5] [--out report.html]");
  process.exit(1);
}
const MIN_PEAK = Number(option("--min-peak") ?? 5);
const RUN_OPTION = option("--run");

// ---------- ficheros ----------

interface LogFiles {
  dir: string;
  species: string;
  settings: string | null;
  creatures: string | null;
  sim: string | null;
}

function findFiles(input: string): LogFiles {
  const exists = (file: string) => (fs.existsSync(file) ? file : null);
  let speciesFile: string;
  if (fs.statSync(input).isDirectory()) {
    const runner = path.join(input, "log-species.csv");
    if (fs.existsSync(runner)) speciesFile = runner;
    else {
      const candidates = fs.readdirSync(input).filter((f) => f.endsWith("species.csv"))
        .map((f) => path.join(input, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
      if (candidates.length === 0) throw new Error(`No hay ningún fichero *species.csv en ${input}`);
      speciesFile = candidates[0];
    }
  } else speciesFile = input;
  const match = speciesFile.match(/^(.*?)(species|settings|creatures)\.csv$/);
  if (!match) throw new Error(`No parece un fichero del log: ${speciesFile}`);
  const prefix = match[1];
  const dir = path.dirname(speciesFile);
  // la app: "sim X log 1-200 species.csv" → "sim X log 1-200.sim"; el runner: final.sim
  const sim = prefix.endsWith(" ") ? exists(prefix.trimEnd() + ".sim") : exists(path.join(dir, "final.sim"));
  return {
    dir,
    species: prefix + "species.csv",
    settings: exists(prefix + "settings.csv"),
    creatures: exists(prefix + "creatures.csv"),
    sim,
  };
}

// ---------- CSV ----------

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].replace(/^﻿/, "").split(";");
  return lines.slice(1).map((line) => {
    const cells = line.split(";");
    const row: Row = {};
    header.forEach((name, i) => (row[name] = cells[i] ?? ""));
    return row;
  });
}

/** número de una celda, con coma o punto decimal; null si está vacía o no es un número */
function num(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
const n0 = (value: string | undefined): number => num(value) ?? 0;

// ---------- ajustes ----------

interface Settings {
  values: Map<string, { value: number | null; text: string; kind: string }>;
  sensors: string[];   // activos, en el orden de la tabla
  actions: string[];
  get(name: string): number | null;
  text(name: string): string;
}

function readSettings(file: string | null): Settings {
  const values = new Map<string, { value: number | null; text: string; kind: string }>();
  const sensors: string[] = [];
  const actions: string[] = [];
  if (file) {
    for (const row of parseCsv(fs.readFileSync(file, "utf8"))) {
      values.set(row.name, { value: num(row.value), text: row.text, kind: row.kind });
      if (row.kind === "SETTING" && row.name.startsWith("sensor.") && num(row.value) === 1) sensors.push(row.name.slice(7));
      if (row.kind === "SETTING" && row.name.startsWith("action.") && num(row.value) === 1) actions.push(row.name.slice(7));
    }
  }
  return {
    values, sensors, actions,
    get: (name) => values.get(name)?.value ?? null,
    text: (name) => values.get(name)?.text || (values.get(name)?.value?.toString() ?? ""),
  };
}

// ---------- genoma ----------

const CLOCK_SENSORS = new Set(["Age", "Oscillator", "Random"]);
const ENV_SENSORS = new Set([
  "TouchNorth", "TouchEast", "TouchSouth", "TouchWest", "Pain", "PopulationDensity", "PreyDistance",
  "PreyNorth", "PreyEast", "PreySouth", "PreyWest", "PredatorDistance", "PredatorDirection", "PreyProximity",
]);
const MOVE_ACTIONS = new Set(["MoveNorth", "MoveSouth", "MoveEast", "MoveWest", "RandomMove", "MoveForward", "MoveToPrey"]);
type SensorKind = "clock" | "self" | "env";
const sensorKind = (name: string): SensorKind => (CLOCK_SENSORS.has(name) ? "clock" : ENV_SENSORS.has(name) ? "env" : "self");

interface Link { from: string; to: string; weight: number }
interface Circuit {
  links: Link[];          // conexiones que quedan después de podar, como en CreatureBrain
  neurons: number;        // neuronas internas que quedan
  sensors: string[];
  actions: string[];
  envSensors: number;     // sensores del entorno usados
  clockSensors: number;
  envToMove: boolean;     // un sensor del entorno llega (directo o por neuronas) a una acción de movimiento
  signature: string;      // sensores → acciones, sin pesos: identifica el comportamiento
  text: string;
}

const circuitCache = new Map<string, Circuit>();

/** Descodifica un genoma como CreatureBrain.createBrainFromGenome(), con los sensores y acciones del log */
function decodeGenome(genomeHex: string, settings: Settings): Circuit | null {
  const cached = circuitCache.get(genomeHex);
  if (cached) return cached;
  const sensorCount = settings.sensors.length;
  const actionCount = settings.actions.length;
  const maxNeurons = settings.get("maxNumberNeurons") ?? 1;
  if (!genomeHex || sensorCount === 0 || actionCount === 0) return null;
  const staminaId = settings.actions.indexOf("Stamina");
  interface Conn { sourceType: number; sourceId: number; sinkType: number; sinkId: number; weight: number }
  const conns: Conn[] = [];
  for (const hex of genomeHex.trim().split(/\s+/)) {
    const gene = parseInt(hex, 16) | 0;
    const c: Conn = {
      sourceType: (gene >> 31) & 1,
      sourceId: (gene >> 24) & 127,
      sinkType: (gene >> 23) & 1,
      sinkId: (gene >> 16) & 127,
      weight: (gene & 65535) / 8192 - 4,
    };
    c.sourceId %= c.sourceType === 1 ? sensorCount : maxNeurons;
    c.sinkId %= c.sinkType === 1 ? actionCount : maxNeurons;
    if (c.sinkType === 1 && c.sinkId === staminaId) continue;   // los genes de Stamina no son conexiones
    conns.push(c);
  }
  // podar las neuronas sin salidas (o que solo se alimentan a sí mismas), como el motor
  const nodes = new Map<number, { outputs: number; selfInputs: number }>();
  const node = (id: number) => {
    let n = nodes.get(id);
    if (!n) nodes.set(id, (n = { outputs: 0, selfInputs: 0 }));
    return n;
  };
  for (const c of conns) {
    if (c.sinkType === 0) {
      const n = node(c.sinkId);
      if (c.sourceType === 0 && c.sourceId === c.sinkId) n.selfInputs++;
    }
    if (c.sourceType === 0) node(c.sourceId).outputs++;
  }
  let done = false;
  while (!done) {
    done = true;
    for (const [id, n] of nodes) {
      if (n.outputs !== n.selfInputs) continue;
      done = false;
      for (let i = conns.length - 1; i >= 0; i--) {
        const c = conns[i];
        if (c.sinkType === 0 && c.sinkId === id) {
          if (c.sourceType === 0) nodes.get(c.sourceId)!.outputs--;
          conns.splice(i, 1);
        }
      }
      nodes.delete(id);
    }
  }
  const remap = new Map<number, number>();
  [...nodes.keys()].forEach((id, i) => remap.set(id, i));
  const name = (type: number, id: number, isSource: boolean) =>
    type === 1 ? (isSource ? settings.sensors[id] : settings.actions[id]) : `N${remap.get(id)}`;
  const links: Link[] = conns.map((c) => ({ from: name(c.sourceType, c.sourceId, true), to: name(c.sinkType, c.sinkId, false), weight: c.weight }));
  const sensors = [...new Set(conns.filter((c) => c.sourceType === 1).map((c) => settings.sensors[c.sourceId]))];
  const actions = [...new Set(conns.filter((c) => c.sinkType === 1).map((c) => settings.actions[c.sinkId]))];
  // qué acciones alcanza cada sensor, siguiendo las neuronas
  const reach = (start: string): Set<string> => {
    const seen = new Set<string>([start]);
    const found = new Set<string>();
    const stack = [start];
    while (stack.length) {
      const from = stack.pop()!;
      for (const l of links) {
        if (l.from !== from) continue;
        if (l.to.startsWith("N") && /^N\d+$/.test(l.to)) {
          if (!seen.has(l.to)) { seen.add(l.to); stack.push(l.to); }
        } else found.add(l.to);
      }
    }
    return found;
  };
  const pairs: string[] = [];
  let envToMove = false;
  for (const s of sensors) {
    const reached = [...reach(s)].sort();
    for (const a of reached) pairs.push(`${s}→${a}`);
    if (sensorKind(s) === "env" && reached.some((a) => MOVE_ACTIONS.has(a))) envToMove = true;
  }
  // acciones movidas solo por neuronas sin entradas (salida constante)
  for (const a of actions) if (!pairs.some((p) => p.endsWith(`→${a}`))) pairs.push(`·→${a}`);
  const circuit: Circuit = {
    links,
    neurons: nodes.size,
    sensors,
    actions,
    envSensors: sensors.filter((s) => sensorKind(s) === "env").length,
    clockSensors: sensors.filter((s) => sensorKind(s) === "clock").length,
    envToMove,
    signature: pairs.sort().join(", "),
    text: links.map((l) => `${l.from} → ${l.to} (${l.weight >= 0 ? "+" : ""}${l.weight.toFixed(1)})`).join("; "),
  };
  circuitCache.set(genomeHex, circuit);
  return circuit;
}

// ---------- especies ----------

const BALANCE = ["Start", "Photosynthesis", "FromPlants", "FromAnimals", "Basal", "Thinking", "Moving", "Attacking",
  "ReproductionCost", "GivenToChildren", "End"] as const;
const COSTS = ["Basal", "Thinking", "Moving", "Attacking", "ReproductionCost"] as const;
const DEATHS = ["Old", "BasalConsumption", "Attacked", "Health"] as const;
const DEATH_LABEL: Record<string, string> = { Old: "vejez", BasalConsumption: "hambre (consumo basal)", Attacked: "atacadas", Health: "salud" };
const GENUS_LABEL: Record<string, string> = { plant: "plantas", attack_plant: "animales", unknown: "sin género" };

interface Run { code: string; index: number; rows: Row[] }

/** separa las ejecuciones: cambia el código o la generación vuelve atrás (reinicio tras una extinción) */
function splitRuns(rows: Row[]): Run[] {
  const runs: Run[] = [];
  let current: Run | null = null;
  let lastGen = -Infinity;
  for (const row of rows) {
    const gen = n0(row.generation);
    if (!current || row.simCode !== current.code || gen < lastGen) {
      current = { code: row.simCode, index: runs.length + 1, rows: [] };
      runs.push(current);
    }
    current.rows.push(row);
    lastGen = gen;
  }
  return runs;
}

/** media ponderada que acumula */
class WMean {
  sum = 0; weight = 0;
  add(value: number | null, weight: number) { if (value !== null && weight > 0) { this.sum += value * weight; this.weight += weight; } }
  get value(): number | null { return this.weight > 0 ? this.sum / this.weight : null; }
}

interface Species {
  id: string;
  parentId: string;
  firstGen: number;
  lastGen: number;
  genus: string;
  genome: string;
  genomeSize: number;
  usedSensors: string;
  usedActions: string;
  generations: number;
  sumAlive: number;     // creaturas × generaciones
  peak: number;
  born: number;
  died: number;
  living: Record<string, WMean>;    // medias de los vivos
  perCreature: Record<string, WMean>;   // medias de vivos y muertos
  deaths: Record<string, WMean>;
  clade: number;
  descendants: number;
  children: Species[];
  parent: Species | null;
  circuit: Circuit | null;
}

const LIVING_COLS = ["avgAge", "avgMass", "avgDistance", "avgStepsStopped", "pctCanMove", "pctCanReproduce"];
const PER_CREATURE_COLS = ["avgChildren", "avgPlantKills", "avgAnimalKills", "avgAttacks", "avgPhotosynthesis",
  "avgFromPlants", "avgFromAnimals", ...BALANCE.map((b) => `avgMass${b}`)];

/** columnas de logs antiguos */
const colValue = (row: Row, col: string): number | null => {
  if (col in row) return num(row[col]);
  if (col === "avgPlantKills") return num(row.avgKills);
  if (col === "avgFromPlants") return num(row.avgFromPrey);
  if (col === "avgMassFromPlants") return num(row.avgMassFromPrey);
  return null;
};

/** la última fila de cada especie en cada generación (con LOG_EVERY_N_STEPS hay varias) */
function lastRowsPerGeneration(rows: Row[]): Map<number, Row[]> {
  const byGen = new Map<number, Map<string, Row>>();
  for (const row of rows) {
    const gen = n0(row.generation);
    let m = byGen.get(gen);
    if (!m) byGen.set(gen, (m = new Map()));
    const prev = m.get(row.speciesId);
    if (!prev || n0(row.step) >= n0(prev.step)) m.set(row.speciesId, row);
  }
  const result = new Map<number, Row[]>();
  [...byGen.keys()].sort((a, b) => a - b).forEach((g) => result.set(g, [...byGen.get(g)!.values()]));
  return result;
}

function buildSpecies(byGen: Map<number, Row[]>, settings: Settings): Map<string, Species> {
  const species = new Map<string, Species>();
  for (const [gen, rows] of byGen) {
    for (const row of rows) {
      let s = species.get(row.speciesId);
      if (!s) {
        s = {
          id: row.speciesId, parentId: row.speciesParentId, firstGen: n0(row.firstGen), lastGen: gen,
          genus: row.genus, genome: row.genome, genomeSize: n0(row.genomeSize), usedSensors: row.usedSensors,
          usedActions: row.usedActions, generations: 0, sumAlive: 0, peak: 0, born: 0, died: 0,
          living: Object.fromEntries(LIVING_COLS.map((c) => [c, new WMean()])),
          perCreature: Object.fromEntries(PER_CREATURE_COLS.map((c) => [c, new WMean()])),
          deaths: Object.fromEntries(["avgAgeAtDeath", ...DEATHS.map((d) => `pctDeath${d}`)].map((c) => [c, new WMean()])),
          clade: 0, descendants: 0, children: [], parent: null, circuit: null,
        };
        species.set(row.speciesId, s);
      }
      const alive = n0(row.alive);
      const died = n0(row.died);
      s.lastGen = gen;
      s.generations++;
      s.sumAlive += alive;
      s.peak = Math.max(s.peak, n0(row.peakAlive), alive);
      s.born += n0(row.born);
      s.died += died;
      for (const c of LIVING_COLS) s.living[c].add(colValue(row, c), alive);
      for (const c of PER_CREATURE_COLS) s.perCreature[c].add(colValue(row, c), alive + died);
      for (const c of Object.keys(s.deaths)) s.deaths[c].add(colValue(row, c), died);
    }
  }
  for (const s of species.values()) {
    s.circuit = decodeGenome(s.genome, settings);
    const parent = species.get(s.parentId);
    if (parent && parent !== s) { s.parent = parent; parent.children.push(s); }
  }
  // éxito del clado: la especie y todas sus descendientes, sin recursión (las cadenas son largas)
  const order: Species[] = [];
  const stack = [...species.values()].filter((s) => !s.parent);
  while (stack.length) {
    const s = stack.pop()!;
    order.push(s);
    for (const child of s.children) stack.push(child);
  }
  for (let i = order.length - 1; i >= 0; i--) {
    const s = order[i];
    s.clade = s.sumAlive + s.children.reduce((sum, c) => sum + c.clade, 0);
    s.descendants = s.children.reduce((sum, c) => sum + 1 + c.descendants, 0);
  }
  return species;
}

// ---------- series temporales ----------

interface GenPoint {
  gen: number;
  alive: Record<string, number>;
  genomeSize: Record<string, number | null>;
  links: Record<string, number | null>;
  neurons: Record<string, number | null>;
  envShare: Record<string, number | null>;
  clockShare: Record<string, number | null>;
  behaviours: Record<string, number | null>;   // número efectivo de comportamientos (exp de Shannon)
  dominant: Record<string, string | null>;
  moveToPrey: Record<string, number | null>;
  envToMove: Record<string, number | null>;
}

function timeSeries(byGen: Map<number, Row[]>, species: Map<string, Species>, genera: string[]): GenPoint[] {
  const points: GenPoint[] = [];
  for (const [gen, rows] of byGen) {
    const p: GenPoint = { gen, alive: {}, genomeSize: {}, links: {}, neurons: {}, envShare: {}, clockShare: {}, behaviours: {}, dominant: {}, moveToPrey: {}, envToMove: {} };
    for (const genus of genera) {
      const gRows = rows.filter((r) => r.genus === genus && n0(r.alive) > 0);
      const total = gRows.reduce((sum, r) => sum + n0(r.alive), 0);
      p.alive[genus] = total;
      const m = { size: new WMean(), links: new WMean(), neurons: new WMean(), env: new WMean(), clock: new WMean(), mtp: new WMean(), envMove: new WMean() };
      const bySignature = new Map<string, number>();
      let best: Row | null = null;
      for (const r of gRows) {
        const alive = n0(r.alive);
        if (!best || alive > n0(best.alive)) best = r;
        const c = species.get(r.speciesId)?.circuit ?? null;
        m.size.add(n0(r.genomeSize), alive);
        if (!c) continue;
        m.links.add(c.links.length, alive);
        m.neurons.add(c.neurons, alive);
        if (c.sensors.length) {
          m.env.add(c.envSensors / c.sensors.length, alive);
          m.clock.add(c.clockSensors / c.sensors.length, alive);
        }
        m.mtp.add(c.actions.includes("MoveToPrey") ? 1 : 0, alive);
        m.envMove.add(c.envToMove ? 1 : 0, alive);
        bySignature.set(c.signature, (bySignature.get(c.signature) ?? 0) + alive);
      }
      p.genomeSize[genus] = m.size.value;
      p.links[genus] = m.links.value;
      p.neurons[genus] = m.neurons.value;
      p.envShare[genus] = m.env.value === null ? null : m.env.value * 100;
      p.clockShare[genus] = m.clock.value === null ? null : m.clock.value * 100;
      p.moveToPrey[genus] = m.mtp.value === null ? null : m.mtp.value * 100;
      p.envToMove[genus] = m.envMove.value === null ? null : m.envMove.value * 100;
      let entropy = 0;
      for (const count of bySignature.values()) { const q = count / total; entropy -= q * Math.log(q); }
      p.behaviours[genus] = total > 0 ? Math.exp(entropy) : null;
      p.dominant[genus] = best?.speciesId ?? null;
    }
    points.push(p);
  }
  return points;
}

// ---------- creatures ----------

interface CreatureInfo { genus: string; species: string; alive: boolean; children: number; mass: number; plantKills: number; animalKills: number; age: number; stopped: number; deathCause: string; killedBy: string; distance: number }

async function readCreatures(file: string, code: string, runIndex: number, runsOfCode: number): Promise<Map<string, CreatureInfo>> {
  const creatures = new Map<string, CreatureInfo>();
  const stream = readline.createInterface({ input: fs.createReadStream(file, "utf8"), crlfDelay: Infinity });
  let header: string[] | null = null;
  let idx: Record<string, number> = {};
  // contar los reinicios dentro del mismo código, como splitRuns
  let lastCode = "";
  let lastGen = -Infinity;
  let run = 0;
  for await (const line of stream) {
    if (!line) continue;
    if (!header) {
      header = line.replace(/^﻿/, "").split(";");
      idx = Object.fromEntries(header.map((h, i) => [h, i]));
      continue;
    }
    const cells = line.split(";");
    const rowCode = cells[idx.simCode];
    const gen = n0(cells[idx.generation]);
    if (rowCode !== lastCode || gen < lastGen) run++;
    lastCode = rowCode; lastGen = gen;
    if (rowCode !== code) continue;
    // con varios reinicios del mismo código, solo la ejecución elegida
    if (runsOfCode > 1 && run !== runIndex) continue;
    const get = (name: string) => cells[idx[name]];
    creatures.set(get("creatureKey"), {
      genus: get("genus"), species: get("speciesId"), alive: get("alive") === "1", children: n0(get("children")),
      mass: n0(get("mass")), plantKills: n0(get("plantKills")), animalKills: n0(get("animalKills")),
      age: n0(get("age")), stopped: n0(get("stepsStopped")), deathCause: get("deathCause") ?? "",
      killedBy: get("killedBySpecies") ?? "", distance: n0(get("distanceCovered")),
    });
  }
  return creatures;
}

// ---------- formato ----------

const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (value: number | null | undefined, decimals = 1): string =>
  value === null || value === undefined || !Number.isFinite(value) ? "—" : value.toLocaleString("es-ES", { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
const pct = (value: number | null | undefined, decimals = 0) => (value === null || value === undefined ? "—" : `${fmt(value, decimals)} %`);
const shortId = (id: string) => id.slice(0, 6);
const genusLabel = (genus: string) => GENUS_LABEL[genus] ?? genus;

const GENUS_VAR: Record<string, string> = { attack_plant: "--s-animal", plant: "--s-plant", unknown: "--s-unknown" };
const genusColor = (genus: string) => `var(${GENUS_VAR[genus] ?? "--s-unknown"})`;

interface Series { name: string; color: string; points: [number, number | null][] }

/** gráfico de líneas en SVG, con un tooltip por punto */
function lineChart(title: string, series: Series[], options: { yUnit?: string; yMin?: number; height?: number; log?: boolean } = {}): string {
  const W = 560, H = options.height ?? 220, L = 48, R = 12, T = 12, B = 28;
  const all = series.flatMap((s) => s.points.filter((p) => p[1] !== null) as [number, number][]);
  if (all.length === 0) return `<figure class="chart"><figcaption>${esc(title)}</figcaption><p class="muted">Sin datos.</p></figure>`;
  const xMin = all.reduce((m, p) => Math.min(m, p[0]), Infinity), xMax = all.reduce((m, p) => Math.max(m, p[0]), -Infinity);
  const yMin = options.yMin ?? 0;
  let yMax = all.reduce((m, p) => Math.max(m, p[1]), -Infinity);
  if (yMax <= yMin) yMax = yMin + 1;
  const niceStep = (range: number) => { const raw = range / 4; const mag = Math.pow(10, Math.floor(Math.log10(raw))); return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!; };
  const step = niceStep(yMax - yMin);
  yMax = Math.ceil(yMax / step) * step;
  const x = (v: number) => L + (xMax === xMin ? 0.5 : (v - xMin) / (xMax - xMin)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">`;
  for (let v = yMin; v <= yMax + 1e-9; v += step) {
    svg += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v, 2)}</text>`;
  }
  const xStep = niceStep(Math.max(1, xMax - xMin));
  for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax; v += xStep) {
    svg += `<text class="tick" x="${x(v)}" y="${H - 8}" text-anchor="middle">${fmt(v, 0)}</text>`;
  }
  svg += `<line class="axis" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>`;
  for (const s of series) {
    let d = "";
    let pen = false;
    for (const [px, py] of s.points) {
      if (py === null) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${x(px).toFixed(1)},${y(py).toFixed(1)}`;
      pen = true;
    }
    svg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  // zonas de hover por generación
  const gens = [...new Set(all.map((p) => p[0]))].sort((a, b) => a - b);
  const half = gens.length > 1 ? (x(gens[1]) - x(gens[0])) / 2 : 10;
  for (const g of gens) {
    const lines = series.map((s) => { const p = s.points.find((q) => q[0] === g); return p && p[1] !== null ? `${s.name}: ${fmt(p[1], 2)}${options.yUnit ?? ""}` : null; }).filter(Boolean);
    svg += `<rect class="hit" x="${x(g) - half}" y="${T}" width="${half * 2}" height="${H - T - B}"><title>Generación ${g}\n${esc(lines.join("\n"))}</title></rect>`;
  }
  svg += "</svg>";
  const legend = series.length > 1
    ? `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("")}</div>` : "";
  return `<figure class="chart"><figcaption>${esc(title)}</figcaption>${legend}${svg}</figure>`;
}

/** barra apilada al 100 % */
function stackBar(parts: { label: string; value: number; color: string }[]): string {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (total <= 0) return `<span class="muted">—</span>`;
  return `<div class="stack">${parts.filter((p) => p.value > 0).map((p) =>
    `<span style="flex:${p.value};background:${p.color}" title="${esc(p.label)}: ${fmt((p.value / total) * 100, 0)} %"></span>`).join("")}</div>`;
}

function table(headers: string[], rows: string[][], numeric: boolean[] = []): string {
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h, i) => `<th${numeric[i] ? ' class="num"' : ""}>${h}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => `<td${numeric[i] ? ' class="num"' : ""}>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

// ---------- análisis ----------

async function main() {
  const files = findFiles(positional[0]);
  const settings = readSettings(files.settings);
  const allRows = parseCsv(fs.readFileSync(files.species, "utf8"));
  if (allRows.length === 0) throw new Error("El fichero de especies está vacío");
  const runs = splitRuns(allRows);
  const run = RUN_OPTION
    ? runs.find((r) => String(r.index) === RUN_OPTION || r.code === RUN_OPTION) ?? (() => { throw new Error(`No hay ninguna ejecución ${RUN_OPTION}`); })()
    : runs.reduce((a, b) => (b.rows.length > a.rows.length ? b : a));
  const byGen = lastRowsPerGeneration(run.rows);
  const species = buildSpecies(byGen, settings);
  const genera = ["attack_plant", "plant", "unknown"].filter((g) => [...species.values()].some((s) => s.genus === g && s.sumAlive > 0));
  const series = timeSeries(byGen, species, genera);
  const gens = series.map((p) => p.gen);
  const firstGen = gens[0], lastGen = gens[gens.length - 1];
  const finalFrom = gens[Math.floor(gens.length * 2 / 3)] ?? firstGen;
  const finalPoints = series.filter((p) => p.gen >= finalFrom);
  const meanFinal = (pick: (p: GenPoint) => number | null) => {
    const values = finalPoints.map(pick).filter((v): v is number => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const all = [...species.values()];
  const relevant = all.filter((s) => s.peak >= MIN_PEAK);
  const ephemeral = all.filter((s) => s.peak < MIN_PEAK);
  const mainGenus = genera.includes("attack_plant") ? "attack_plant" : genera[0];
  const runsOfCode = runs.filter((r) => r.code === run.code).length;
  const runIndexOfCode = runs.filter((r) => r.code === run.code).indexOf(run) + 1;
  const creatures = files.creatures ? await readCreatures(files.creatures, run.code, runIndexOfCode, runsOfCode) : null;

  // ----- secciones -----
  const sections: string[] = [];
  const st = (name: string) => settings.text(name);

  // 1. ficha
  const metab = settings.get("metabolismEnabled");
  const constant = (name: string) => settings.values.get(name);
  const cText = (name: string) => { const v = constant(name); return v ? (v.text || fmt(v.value, 4)) : "—"; };
  const assimRows = [...settings.values.keys()].filter((k) => k.startsWith("ASSIMILATION_EFFICIENCY."));
  const costRows = [...settings.values.keys()].filter((k) => (k.startsWith("SENSOR_COSTS.") || k.startsWith("ACTION_COSTS.")) && (settings.get(k) ?? 0) !== 0);
  const ficha: [string, string][] = [
    ["Código / ejecución", `${esc(run.code)} · ejecución ${run.index} de ${runs.length}`],
    ["Generaciones analizadas", `${firstGen} – ${lastGen} (${gens.length})`],
    ["Tipo", `${esc(st("simulationType"))}, metabolismo ${metab === null ? "—" : metab ? "sí" : "no"}`],
    ["Mundo", `${st("size")} × ${st("size")}, población inicial ${st("initialPopulation")}, ${st("stepsPerGen")} pasos por generación, edad máxima ${st("maxAge")}`],
    ["Población y selección", `${esc(st("populationStrategy"))} · ${esc(st("selectionMethod"))}`],
    ["Semilla", `${esc(st("seed"))} (esta ejecución: ${esc(st("runSeed"))})`],
    ["Cerebro", `genoma inicial ${st("initialGenomeSize")}, máximo ${st("maxGenomeSize")} genes, ${st("maxNumberNeurons")} neuronas`],
    ["Mutación", `${esc(st("mutationMode"))}, probabilidad ${st("mutationProbability")}, inserción/borrado ${st("geneInsertionDeletionProbability")}`],
    ["Sensores activos", esc(settings.sensors.join(", ")) || "—"],
    ["Acciones activas", esc(settings.actions.join(", ")) || "—"],
    ["Costes", `gen ${cText("MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE")}, gen primario ${cText("MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY")}, moverse ${cText("MOVE_COST_PER_MASS")}, atacar ${cText("ATTACK_COST_PER_MASS")}, reproducirse ${cText("REPRODUCTION_COST_PER_MASS_DO")}` +
      (costRows.length ? `; ${costRows.map((k) => `${esc(k)} ${fmt(settings.get(k), 4)}`).join(", ")}` : "")],
    ["Comer", `el atacante pesa al menos ${cText("ATTACK_MIN_PREY_MASS_FACTOR")} veces la presa, comer al mismo género ${cText("ATTACK_SAME_GENUS")}, radio de detección ${cText("DETECT_RADIUS")}` +
      (assimRows.length ? `; eficiencia ${assimRows.map((k) => `${esc(k.replace("ASSIMILATION_EFFICIENCY.", ""))} ${fmt(settings.get(k), 2)}`).join(", ")}` : "")],
    ["Agua", `lluvia ${esc(st("rainType"))}, máximo ${st("waterRainMaxPerCell")} por casilla, evaporación ${st("waterEvaporationPerCellPerGeneration")}`],
    ["Ficheros", [files.species, files.settings, files.creatures, files.sim].filter(Boolean).map((f) => esc(path.basename(f!))).join("<br>")],
  ];
  if (!files.settings) ficha.push(["Aviso", "Sin fichero de ajustes: los genomas no se pueden descodificar."]);

  // 2. resumen
  const byClade = [...relevant].sort((a, b) => b.clade - a.clade);
  const byMass = [...all].sort((a, b) => b.sumAlive - a.sumAlive);
  const lastPoint = series[series.length - 1];
  const firstPoint = series[0];
  const summary: string[] = [];
  summary.push(`${all.length.toLocaleString("es-ES")} especies en ${gens.length} generaciones; ${relevant.length} relevantes (pico ≥ ${MIN_PEAK} creaturas) y ${ephemeral.length} efímeras (el ${fmt((ephemeral.length / all.length) * 100, 0)} %).`);
  if (runs.length > 1) summary.push(`El log tiene ${runs.length} ejecuciones: la población se extinguió ${runs.length - 1} ${runs.length - 1 === 1 ? "vez" : "veces"}. Se analiza la ${run.index}.`);
  summary.push(`Al final: ${genera.map((g) => `${fmt(lastPoint.alive[g], 0)} ${genusLabel(g)}`).join(", ")}.`);
  if (byMass[0]) summary.push(`La especie con más presencia es <b>${shortId(byMass[0].id)}</b> (${genusLabel(byMass[0].genus)}, ${fmt(byMass[0].sumAlive, 0)} creaturas × generación, ${byMass[0].generations} generaciones): ${esc(byMass[0].circuit?.text || byMass[0].usedSensors + " → " + byMass[0].usedActions)}.`);
  if (byClade[0]) summary.push(`El linaje de más éxito empieza en <b>${shortId(byClade[0].id)}</b> (generación ${byClade[0].firstGen}): ${byClade[0].descendants} especies descendientes y el ${fmt((byClade[0].clade / Math.max(1, all.filter((s) => !s.parent).reduce((t, s) => t + s.clade, 0))) * 100, 0)} % de toda la población del log.`);
  for (const g of genera) {
    const a = firstPoint.links[g], b = meanFinal((p) => p.links[g]);
    if (a !== null && b !== null) summary.push(`Complejidad de ${genusLabel(g)}: de ${fmt(a)} a ${fmt(b)} conexiones efectivas; ${pct(meanFinal((p) => p.envShare[g]))} de sus sensores miran al entorno al final.`);
  }
  sections.push(`<section><h2>Resumen</h2><ul>${summary.map((s) => `<li>${s}</li>`).join("")}</ul></section>`);

  // 3. población
  const popCharts = genera.map((g) => lineChart(`Creaturas vivas: ${genusLabel(g)}`, [{ name: genusLabel(g), color: genusColor(g), points: series.map((p) => [p.gen, p.alive[g]]) }]));
  const relevantPerGen = series.map((p) => [p.gen, (byGen.get(p.gen) ?? []).filter((r) => n0(r.alive) > 0 && (species.get(r.speciesId)?.peak ?? 0) >= MIN_PEAK).length] as [number, number]);
  popCharts.push(lineChart("Especies relevantes vivas", [{ name: "especies", color: "var(--s-1)", points: relevantPerGen }]));
  sections.push(`<section><h2>Población</h2><p class="muted">Cada género en su propio gráfico: las plantas suelen ser muchas más y aplastarían a los animales en un eje común.</p><div class="grid">${popCharts.join("")}</div></section>`);

  // 4. especies de más éxito
  const deathBar = (s: Species) => stackBar(DEATHS.map((d, i) => ({ label: DEATH_LABEL[d], value: s.deaths[`pctDeath${d}`].value ?? 0, color: `var(--d-${i + 1})` })));
  const deathLegend = `<div class="legend">${DEATHS.map((d, i) => `<span><i style="background:var(--d-${i + 1})"></i>${DEATH_LABEL[d]}</span>`).join("")}</div>`;
  const speciesRow = (s: Species) => [
    `<code>${shortId(s.id)}</code>`, genusLabel(s.genus), `${s.firstGen}–${s.lastGen}`, fmt(s.generations, 0), fmt(s.sumAlive, 0), fmt(s.peak, 0),
    fmt(s.clade, 0), fmt(s.descendants, 0), fmt(s.perCreature.avgChildren.value, 2), deathBar(s),
    `<span class="circuit">${esc(s.circuit?.text || `${s.usedSensors} → ${s.usedActions}`)}</span>`,
  ];
  const speciesHeaders = ["Especie", "Género", "Generaciones", "Duración", "Creaturas × gen", "Pico", "Clado", "Descend.", "Hijos/creatura", "Muertes", "Circuito"];
  const speciesNum = [false, false, false, true, true, true, true, true, true, false, false];
  const topByGenus = genera.map((g) => {
    const top = relevant.filter((s) => s.genus === g).sort((a, b) => b.sumAlive - a.sumAlive).slice(0, 10);
    return top.length ? `<h3>${genusLabel(g)}</h3>${table(speciesHeaders, top.map(speciesRow), speciesNum)}` : "";
  }).join("");
  const topClades = byClade.slice(0, 8);
  sections.push(`<section><h2>Especies de más éxito</h2>
<p>Cuatro medidas, porque no coinciden: <b>duración</b> (generaciones con creaturas), <b>creaturas × generación</b> (suma de vivos en cada generación: cuánto ha dominado), <b>pico</b> y <b>clado</b> (la especie más todas sus descendientes: si ha fundado un linaje, aunque ella misma desaparezca). El circuito es el genoma descodificado y podado como lo hace el motor: <code>sensor → acción (peso)</code>, con <code>N0</code>, <code>N1</code>… las neuronas internas.</p>
${deathLegend}${topByGenus}
<h3>Fundadores de los linajes de más éxito</h3>${table(speciesHeaders, topClades.map(speciesRow), speciesNum)}</section>`);

  // 5. perfil comparado
  const groupStats = (group: Species[]) => {
    const w = (pick: (s: Species) => number | null, weight: (s: Species) => number) => {
      const m = new WMean();
      for (const s of group) m.add(pick(s), weight(s));
      return m.value;
    };
    const wc = (s: Species) => s.sumAlive + s.died;
    const costTotal = (s: Species) => COSTS.reduce((t, c) => t + Math.abs(s.perCreature[`avgMass${c}`].value ?? 0), 0);
    const share = (c: string) => w((s) => { const t = costTotal(s); return t > 0 ? Math.abs(s.perCreature[`avgMass${c}`].value ?? 0) / t * 100 : null; }, wc);
    const gains = (s: Species) => ["Photosynthesis", "FromPlants", "FromAnimals"].reduce((t, k) => t + (s.perCreature[`avgMass${k}`].value ?? 0), 0);
    return {
      n: group.length,
      duration: w((s) => s.generations, () => 1),
      genome: w((s) => s.genomeSize, wc),
      links: w((s) => s.circuit?.links.length ?? null, wc),
      neurons: w((s) => s.circuit?.neurons ?? null, wc),
      env: w((s) => (s.circuit && s.circuit.sensors.length ? (s.circuit.envSensors / s.circuit.sensors.length) * 100 : null), wc),
      children: w((s) => s.perCreature.avgChildren.value, wc),
      gains: w(gains, wc),
      net: w((s) => gains(s) - costTotal(s), wc),
      basal: share("Basal"), thinking: share("Thinking"), moving: share("Moving"), attacking: share("Attacking"), repro: share("ReproductionCost"),
      stopped: w((s) => { const age = s.living.avgAge.value; const stopped = s.living.avgStepsStopped.value; return age && stopped !== null ? Math.min(100, (stopped / age) * 100) : null; }, (s) => s.sumAlive),
      canRepro: w((s) => s.living.pctCanReproduce.value, (s) => s.sumAlive),
      ageDeath: w((s) => s.deaths.avgAgeAtDeath.value, (s) => s.died),
      deathHunger: w((s) => s.deaths.pctDeathBasalConsumption.value, (s) => s.died),
      deathAttacked: w((s) => s.deaths.pctDeathAttacked.value, (s) => s.died),
      deathOld: w((s) => s.deaths.pctDeathOld.value, (s) => s.died),
    };
  };
  const profile = genera.map((g) => {
    const rel = relevant.filter((s) => s.genus === g).sort((a, b) => b.sumAlive - a.sumAlive);
    const cut = Math.max(1, Math.ceil(rel.length * 0.1));
    const groups = [
      { name: `Las de más éxito (10 % de las relevantes, ${cut})`, stats: groupStats(rel.slice(0, cut)) },
      { name: `Resto de relevantes (${rel.length - cut})`, stats: groupStats(rel.slice(cut)) },
      { name: `Efímeras (${ephemeral.filter((s) => s.genus === g).length})`, stats: groupStats(ephemeral.filter((s) => s.genus === g)) },
    ];
    const metrics: [string, (st: ReturnType<typeof groupStats>) => string][] = [
      ["Duración media (generaciones)", (x) => fmt(x.duration)],
      ["Genes", (x) => fmt(x.genome)],
      ["Conexiones efectivas", (x) => fmt(x.links)],
      ["Neuronas internas", (x) => fmt(x.neurons)],
      ["Sensores del entorno", (x) => pct(x.env)],
      ["Hijos por creatura", (x) => fmt(x.children, 2)],
      ["Masa ganada por creatura", (x) => fmt(x.gains, 2)],
      ["Ganada − gastada", (x) => fmt(x.net, 2)],
      ["Gasto: basal (genes)", (x) => pct(x.basal)],
      ["Gasto: pensar (sensores y acciones)", (x) => pct(x.thinking)],
      ["Gasto: moverse", (x) => pct(x.moving)],
      ["Gasto: atacar", (x) => pct(x.attacking)],
      ["Gasto: reproducirse", (x) => pct(x.repro)],
      ["Sin moverse desde hace (% de la edad, vivas)", (x) => pct(x.stopped)],
      ["Vivas con masa para reproducirse", (x) => pct(x.canRepro)],
      ["Edad al morir", (x) => fmt(x.ageDeath, 0)],
      ["Muertes por hambre", (x) => pct(x.deathHunger)],
      ["Muertes por ataque", (x) => pct(x.deathAttacked)],
      ["Muertes por vejez", (x) => pct(x.deathOld)],
    ];
    return `<h3>${genusLabel(g)}</h3>${table(["", ...groups.map((x) => x.name)], metrics.map(([label, f]) => [label, ...groups.map((x) => f(x.stats))]), [false, true, true, true])}`;
  }).join("");
  sections.push(`<section><h2>Qué distingue a las especies de éxito</h2><p>Medias ponderadas por creaturas. Los gastos son el reparto de la masa gastada (basal, pensar, moverse, atacar, reproducirse) y se leen junto a la masa ganada: un grupo con éxito suele ganar más de lo que gasta, reproducirse más y morir de vejez y no de hambre.</p>${profile}</section>`);

  // 6. mutaciones padre → hija
  interface ChangeStat { label: string; count: number; relevant: number; peakSum: number; best: Species | null }
  const changes = new Map<string, ChangeStat>();
  const addChange = (label: string, s: Species) => {
    let c = changes.get(label);
    if (!c) changes.set(label, (c = { label, count: 0, relevant: 0, peakSum: 0, best: null }));
    c.count++;
    c.peakSum += s.peak;
    if (s.peak >= MIN_PEAK) c.relevant++;
    if (!c.best || s.clade > c.best.clade) c.best = s;
  };
  for (const s of all) {
    const p = s.parent;
    if (!p || !s.circuit || !p.circuit) continue;
    const labels: string[] = [];
    if (s.genomeSize > p.genomeSize) labels.push("gen añadido");
    else if (s.genomeSize < p.genomeSize) labels.push("gen borrado");
    if (s.genus !== p.genus) labels.push(`cambia de género: ${genusLabel(p.genus)} → ${genusLabel(s.genus)}`);
    for (const x of s.circuit.sensors) if (!p.circuit.sensors.includes(x)) labels.push(`gana sensor ${x}`);
    for (const x of p.circuit.sensors) if (!s.circuit.sensors.includes(x)) labels.push(`pierde sensor ${x}`);
    for (const x of s.circuit.actions) if (!p.circuit.actions.includes(x)) labels.push(`gana acción ${x}`);
    for (const x of p.circuit.actions) if (!s.circuit.actions.includes(x)) labels.push(`pierde acción ${x}`);
    if (s.circuit.neurons > p.circuit.neurons) labels.push("gana neurona");
    if (s.circuit.neurons < p.circuit.neurons) labels.push("pierde neurona");
    if (s.circuit.links.length > p.circuit.links.length) labels.push("más conexiones efectivas");
    if (s.circuit.links.length < p.circuit.links.length) labels.push("menos conexiones efectivas");
    if (s.circuit.signature === p.circuit.signature) labels.push(s.circuit.text === p.circuit.text ? "sin efecto en la red (gen podado)" : "mismo circuito, otros pesos");
    else if (!labels.some((l) => l.startsWith("gana") || l.startsWith("pierde"))) labels.push("recablea el circuito");
    for (const l of labels) addChange(l, s);
  }
  const daughters = all.filter((s) => s.parent && s.circuit && s.parent.circuit);
  const baseRate = daughters.length ? daughters.filter((s) => s.peak >= MIN_PEAK).length / daughters.length * 100 : null;
  const changeRows = [...changes.values()].filter((c) => c.count >= 3).sort((a, b) => b.relevant / b.count - a.relevant / a.count || b.count - a.count).slice(0, 30)
    .map((c) => {
      const rate = (c.relevant / c.count) * 100;
      const cls = baseRate === null ? "" : rate > baseRate * 1.5 ? "good" : rate < baseRate * 0.5 ? "bad" : "";
      return [esc(c.label), fmt(c.count, 0), `<span class="${cls}">${pct(rate, 1)}</span>`, fmt(c.peakSum / c.count, 1),
        c.best ? `<code>${shortId(c.best.id)}</code> (clado ${fmt(c.best.clade, 0)})` : "—"];
    });
  sections.push(`<section><h2>Qué mutaciones funcionan</h2><p>Cada especie hija se diferencia de su padre en una mutación, así que comparar cada hija con su padre es un experimento natural: qué cambio del cerebro ayuda o perjudica. Una hija puede tener varias etiquetas. De media llega a relevante el <b>${pct(baseRate, 1)}</b> de las hijas: <span class="good">verde</span> es más de 1,5 veces esa tasa y <span class="bad">rojo</span> menos de la mitad. Solo cambios con al menos 3 hijas.</p>${table(["Cambio", "Hijas", "Llegan a relevantes", "Pico medio", "Mejor ejemplo"], changeRows, [false, true, true, true, false])}</section>`);

  // 7. relevos de la especie dominante
  const shifts = genera.map((g) => {
    const rows: string[][] = [];
    let prev: string | null = null;
    for (const p of series) {
      const d = p.dominant[g];
      if (!d || d === prev) continue;
      const s = species.get(d)!;
      const before = prev ? species.get(prev) : null;
      const related = before ? (s.parent === before ? "hija" : before.parent === s ? "padre" : s.parent && s.parent === before.parent ? "hermana" : "otro linaje") : "—";
      const dominantAlive = n0(byGen.get(p.gen)!.find((r) => r.speciesId === d)?.alive);
      rows.push([fmt(p.gen, 0), before ? `<code>${shortId(before.id)}</code>` : "—", `<code>${shortId(s.id)}</code>`, related,
        pct(p.alive[g] ? (dominantAlive / p.alive[g]) * 100 : null),
        `<span class="circuit">${esc(s.circuit?.text ?? "")}</span>`]);
      prev = d;
    }
    const shown = rows.length > 25 ? [...rows.slice(0, 12), ["…", "", "", "", "", ""], ...rows.slice(-12)] : rows;
    return `<h3>${genusLabel(g)} (${rows.length} relevos)</h3>${table(["Generación", "Antes", "Ahora", "Relación", "Cuota", "Circuito de la nueva"], shown, [true, false, false, false, true, false])}`;
  }).join("");
  sections.push(`<section><h2>Relevos de la especie dominante</h2><p>Cuándo cambia la especie con más creaturas de cada género. Si la nueva es <b>hija</b> de la anterior, ganó por una mutación; si es de <b>otro linaje</b>, el entorno cambió a su favor (mira la población y las causas de muerte en esas generaciones).</p>${shifts}</section>`);

  // 8. complejidad
  const multi = (title: string, pick: (p: GenPoint) => Record<string, number | null>, unit = "") =>
    lineChart(title, genera.map((g) => ({ name: genusLabel(g), color: genusColor(g), points: series.map((p) => [p.gen, pick(p)[g]] as [number, number | null]) })), { yUnit: unit });
  const complexityCharts = [
    multi("Genes por creatura", (p) => p.genomeSize),
    multi("Conexiones efectivas (después de podar)", (p) => p.links),
    multi("Neuronas internas usadas", (p) => p.neurons),
    multi("Sensores del entorno (% de los usados)", (p) => p.envShare, " %"),
    multi("Relojes y azar: Age, Oscillator, Random (%)", (p) => p.clockShare, " %"),
    multi("Comportamientos distintos (número efectivo)", (p) => p.behaviours),
    multi("Un sensor del entorno mueve la creatura (%)", (p) => p.envToMove, " %"),
  ];
  if (settings.actions.includes("MoveToPrey")) complexityCharts.push(multi("Usan MoveToPrey (%)", (p) => p.moveToPrey, " %"));
  const signatures = genera.map((g) => {
    const counts = new Map<string, number>();
    for (const r of byGen.get(lastGen) ?? []) {
      if (r.genus !== g || n0(r.alive) === 0) continue;
      const sig = species.get(r.speciesId)?.circuit?.signature ?? "?";
      counts.set(sig, (counts.get(sig) ?? 0) + n0(r.alive));
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([sig, c]) => [esc(sig || "(nada)"), fmt(c, 0), pct((c / total) * 100)]);
    return rows.length ? `<h3>Comportamientos de ${genusLabel(g)} en la generación ${lastGen}</h3>${table(["Sensores → acciones", "Creaturas", "Cuota"], rows, [false, true, true])}` : "";
  }).join("");
  sections.push(`<section><h2>Complejidad</h2>
<p>Medias ponderadas por creaturas vivas al final de cada generación. Los sensores se agrupan en <b>entorno</b> (Touch, Pain, PopulationDensity, Prey…, Predator…), <b>reloj y azar</b> (Age, Oscillator, Random) y <b>posición y estado propio</b> (posición, distancias al borde, velocidades, Mass). Un comportamiento es el conjunto de pares sensor → acción que el circuito conecta, sin pesos; el número efectivo es exp(entropía): 1 si todas hacen lo mismo, <i>k</i> si hay <i>k</i> comportamientos igual de frecuentes.</p>
<div class="grid">${complexityCharts.join("")}</div>${signatures}</section>`);

  // 9. balance de masa
  const balanceRows = genera.flatMap((g) => relevant.filter((s) => s.genus === g).sort((a, b) => b.sumAlive - a.sumAlive).slice(0, 5)).map((s) => {
    const v = (k: string) => s.perCreature[`avgMass${k}`].value;
    const gainsParts = [
      { label: "fotosíntesis", value: Math.abs(v("Photosynthesis") ?? 0), color: "var(--g-photo)" },
      { label: "de plantas", value: Math.abs(v("FromPlants") ?? 0), color: "var(--g-plant)" },
      { label: "de animales", value: Math.abs(v("FromAnimals") ?? 0), color: "var(--g-animal)" },
    ];
    const costParts = COSTS.map((c, i) => ({ label: c, value: Math.abs(v(c) ?? 0), color: `var(--c-${i + 1})` }));
    return [`<code>${shortId(s.id)}</code>`, genusLabel(s.genus), fmt(v("Start"), 2), stackBar(gainsParts), fmt(gainsParts.reduce((t, p) => t + p.value, 0), 2), stackBar(costParts), fmt(costParts.reduce((t, p) => t + p.value, 0), 2), fmt(v("GivenToChildren"), 2), fmt(v("End"), 2)];
  });
  const costLegend = `<div class="legend">${[["fotosíntesis", "--g-photo"], ["de plantas", "--g-plant"], ["de animales", "--g-animal"]].map(([l, c]) => `<span><i style="background:var(${c})"></i>${l}</span>`).join("")}</div>
<div class="legend">${["basal (genes)", "pensar (sensores y acciones)", "moverse", "atacar", "reproducirse"].map((l, i) => `<span><i style="background:var(--c-${i + 1})"></i>${l}</span>`).join("")}</div>`;
  sections.push(`<section><h2>Balance de masa de las especies principales</h2><p>Media por creatura (vivas y muertas de cada generación). Pasa el ratón por las barras para ver cada parte.</p>${costLegend}${table(["Especie", "Género", "Al empezar", "Ganancias", "Total", "Gastos", "Total", "A los hijos", "Al final"], balanceRows, [false, false, true, false, true, false, true, true, true])}</section>`);

  // 10. creatures
  let trophic = 0;
  if (creatures) {
    const list = [...creatures.values()];
    const parts: string[] = [];
    const kills = new Map<string, Map<string, number>>();
    for (const c of list) {
      if (!c.killedBy) continue;
      trophic++;
      const killer = species.get(c.killedBy);
      const key = killer ? killer.id : c.killedBy;
      let m = kills.get(key);
      if (!m) kills.set(key, (m = new Map()));
      m.set(c.genus, (m.get(c.genus) ?? 0) + 1);
    }
    const killRows = [...kills.entries()].map(([k, m]) => ({ k, m, total: [...m.values()].reduce((a, b) => a + b, 0) })).sort((a, b) => b.total - a.total).slice(0, 12)
      .map(({ k, m, total }) => [`<code>${shortId(k)}</code>`, species.get(k) ? genusLabel(species.get(k)!.genus) : "?", fmt(total, 0), ...genera.map((g) => fmt(m.get(g) ?? 0, 0))]);
    parts.push(`<h3>Quién se come a quién</h3><p>${fmt(trophic, 0)} creaturas muertas por un ataque, según <code>killedBySpecies</code>. Columnas: género de la víctima.</p>${table(["Especie atacante", "Género", "Víctimas", ...genera.map(genusLabel)], killRows, [false, false, true, ...genera.map(() => true)])}`);
    const quant = (values: number[], q: number) => { if (!values.length) return null; const s = [...values].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
    const varRows = genera.flatMap((g) => relevant.filter((s) => s.genus === g).sort((a, b) => b.sumAlive - a.sumAlive).slice(0, 4)).map((s) => {
      const members = list.filter((c) => c.species === s.id);
      const ch = members.map((c) => c.children);
      const eaten = members.map((c) => c.plantKills + c.animalKills);
      const stopped = members.filter((c) => c.alive && c.age > 0).map((c) => Math.min(100, (c.stopped / c.age) * 100));
      return [`<code>${shortId(s.id)}</code>`, genusLabel(s.genus), fmt(members.length, 0), pct(members.length ? (ch.filter((x) => x === 0).length / members.length) * 100 : null),
        `${fmt(quant(ch, 0.5), 0)} / ${fmt(quant(ch, 0.9), 0)} / ${fmt(quant(ch, 1), 0)}`,
        `${fmt(quant(eaten, 0.5), 0)} / ${fmt(quant(eaten, 0.9), 0)}`, pct(quant(stopped, 0.5))];
    });
    parts.push(`<h3>Variación dentro de las especies</h3><p>Las medias esconden que en muchas especies unas pocas creaturas tienen casi todos los hijos.</p>${table(["Especie", "Género", "Creaturas", "Sin hijos", "Hijos: mediana / p90 / máx.", "Presas: mediana / p90", "Vivas: sin moverse desde hace (% de la edad, mediana)"], varRows, [false, false, true, true, true, true, true])}`);
    sections.push(`<section><h2>Creaturas</h2><p>Del fichero de creaturas: ${fmt(list.length, 0)} creaturas de esta ejecución, cada una con su último estado.</p>${parts.join("")}</section>`);
  }

  // 11. diagnóstico
  interface Finding { level: "warn" | "info" | "ok"; title: string; evidence: string; action: string }
  const findings: Finding[] = [];
  const animals = genera.includes("attack_plant");
  const gStats = (g: string) => groupStats(relevant.filter((s) => s.genus === g && s.lastGen >= finalFrom));
  const A = animals ? gStats("attack_plant") : null;
  const maxGenome = settings.get("maxGenomeSize") ?? 0;
  const maxNeurons = settings.get("maxNumberNeurons") ?? 1;
  const geneCost = settings.get("MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE");
  const moveCost = settings.get("MOVE_COST_PER_MASS");
  const genomeFinal = meanFinal((p) => p.genomeSize[mainGenus]);
  const linksFinal = meanFinal((p) => p.links[mainGenus]);
  const envFinal = meanFinal((p) => p.envShare[mainGenus]);
  const behavFinal = meanFinal((p) => p.behaviours[mainGenus]);
  const who = genusLabel(mainGenus);
  if (metab === 0) findings.push({ level: "info", title: "Metabolismo desactivado", evidence: "Sin metabolismo la masa no cambia y la acción Reproduction nunca funciona.", action: "Actívalo (<code>metabolismEnabled</code>) si quieres que el éxito dependa de comer y gastar." });
  if (linksFinal !== null && maxGenome >= 6 && linksFinal <= 3)
    findings.push({ level: "warn", title: "Cerebros mínimos", evidence: `${who}: ${fmt(linksFinal)} conexiones efectivas de media al final, con hasta ${maxGenome} genes posibles.`, action: `Pensar sale caro: baja <code>MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE</code> (ahora ${fmt(geneCost, 4)}) a 0.005–0.01 y revisa <code>SENSOR_COSTS</code>/<code>ACTION_COSTS</code>.` });
  if (genomeFinal !== null && maxGenome > 0 && genomeFinal >= maxGenome * 0.9)
    findings.push({ level: "warn", title: "Genoma en el techo", evidence: `${who}: ${fmt(genomeFinal)} genes de media con un máximo de ${maxGenome}.`, action: `Sube <code>maxGenomeSize</code> (a ${Math.max(8, maxGenome * 2)}–${Math.max(12, maxGenome * 3)}): la evolución quiere más genes de los que puede tener.` });
  if (maxNeurons <= 1)
    findings.push({ level: "warn", title: "Una sola neurona interna", evidence: `<code>maxNumberNeurons</code> = ${maxNeurons}: casi todos los circuitos son reflejos sensor → acción.`, action: "Sube a 2–3 neuronas, junto con un genoma más grande. En los experimentos de giros fue lo que permitió los temporizadores." });
  else if (meanFinal((p) => p.neurons[mainGenus]) !== null && meanFinal((p) => p.neurons[mainGenus])! < 0.3)
    findings.push({ level: "info", title: "Neuronas sin usar", evidence: `${who}: ${fmt(meanFinal((p) => p.neurons[mainGenus]), 2)} neuronas internas de media con ${maxNeurons} posibles.`, action: "No hacen falta para lo que resuelven: el entorno no premia combinar información. Ver “entorno predecible”." });
  if (A && A.thinking !== null && A.thinking > 30)
    findings.push({ level: "warn", title: "Pensar es el gasto principal", evidence: `Animales: el ${pct(A.thinking)} de la masa gastada se va en sensores y acciones.`, action: "Baja <code>SENSOR_COSTS</code> y <code>ACTION_COSTS</code>." });
  if (A && A.stopped !== null && A.stopped > 90)
    findings.push({ level: "warn", title: "Animales sedentarios", evidence: `Los animales vivos llevan sin moverse el ${pct(A.stopped)} de su vida (racha actual, <code>avgStepsStopped</code> / <code>avgAge</code>).`, action: `Baja <code>MOVE_COST_PER_MASS</code> (ahora ${fmt(moveCost, 3)}) a 0.01–0.04 y dispersa la comida (mundo más grande, menos plantas). Si las plantas brotan a su lado, moverse no compensa.` });
  if (A && A.moving !== null && A.moving > 50)
    findings.push({ level: "warn", title: "Moverse es el gasto principal", evidence: `Animales: el ${pct(A.moving)} de la masa gastada se va en moverse.`, action: `Baja <code>MOVE_COST_PER_MASS</code> (ahora ${fmt(moveCost, 3)}).` });
  if (animals) {
    const photoShare = (() => {
      const m = new WMean();
      for (const s of relevant.filter((x) => x.genus === "attack_plant")) {
        const p = s.perCreature.avgMassPhotosynthesis.value ?? 0;
        const total = p + (s.perCreature.avgMassFromPlants.value ?? 0) + (s.perCreature.avgMassFromAnimals.value ?? 0);
        if (total > 0) m.add((p / total) * 100, s.sumAlive);
      }
      return m.value;
    })();
    if (photoShare !== null && photoShare > 20)
      findings.push({ level: "warn", title: "Los animales hacen fotosíntesis", evidence: `El ${pct(photoShare)} de la masa que ganan los animales viene de la fotosíntesis.`, action: "Pon <code>ASSIMILATION_EFFICIENCY.attack_plant.photosynthesis</code> = 0: crecen sin comer y no necesitan buscar comida." });
    const pop = finalPoints.length ? series.filter((p) => p.gen >= firstGen + 5).map((p) => p.alive.attack_plant) : [];
    const mean = pop.length ? pop.reduce((a, b) => a + b, 0) / pop.length : 0;
    const cv = mean > 0 ? Math.sqrt(pop.reduce((t, v) => t + (v - mean) ** 2, 0) / pop.length) / mean : null;
    if ((cv !== null && cv > 0.6) || runs.length > 1)
      findings.push({ level: "warn", title: "Auges y caídas", evidence: `Población de animales con un coeficiente de variación de ${fmt(cv, 2)}${runs.length > 1 ? `; ${runs.length - 1} extinciones en el log` : ""}.`, action: "Comer rinde demasiado: baja <code>ASSIMILATION_EFFICIENCY.attack_plant.prey</code> a 0.3–0.5 para frenar los auges que arrasan las plantas." });
    if (A && A.deathHunger !== null && A.deathHunger > 70)
      findings.push({ level: "warn", title: "Mueren de hambre", evidence: `Animales: el ${pct(A.deathHunger)} de las muertes por consumo basal.`, action: "La comida no llega o los costes son altos: revisa el coste por gen, el de moverse y la cantidad de plantas." });
    if (!all.some((s) => (s.perCreature.avgAnimalKills.value ?? 0) > 0))
      findings.push({ level: "info", title: "No hay depredadores", evidence: "Ninguna especie ha matado animales.", action: "Sin depredadores no hay presión para huir ni esconderse. Activa <code>ATTACK_SAME_GENUS</code> o añade carnívoros. Ojo: <code>PredatorDistance</code> y <code>PredatorDirection</code> dan NaN (docs/known-issues.md) y habría que arreglarlos antes." });
    if (settings.actions.includes("MoveToPrey") && (meanFinal((p) => p.moveToPrey.attack_plant) ?? 0) > 50)
      findings.push({ level: "info", title: "Atajo MoveToPrey", evidence: `El ${pct(meanFinal((p) => p.moveToPrey.attack_plant))} de los animales usa MoveToPrey.`, action: "Resuelve la persecución con un gen. Para forzar cerebros más ricos, quítalo y deja <code>PreyNorth/East/South/West</code> + <code>MoveNorth/South/East/West</code>." });
  }
  const envEnabled = settings.sensors.filter((s) => sensorKind(s) === "env");
  if (files.settings && envEnabled.length === 0)
    findings.push({ level: "warn", title: "Ningún sensor del entorno", evidence: "Solo hay sensores de posición, estado propio y relojes.", action: "Activa <code>Prey*</code>, <code>Touch*</code> o <code>PopulationDensity</code>: sin ellos no pueden reaccionar a nada." });
  else if (envFinal !== null && envFinal < 25)
    findings.push({ level: "warn", title: "Entorno predecible: relojes en vez de reacciones", evidence: `${who}: solo el ${pct(envFinal)} de los sensores usados miran al entorno.`, action: `Un reloj basta cuando el entorno es predecible. Dispersa la comida (mundo más grande, menos lluvia), añade obstáculos${settings.sensors.some((s) => s.startsWith("Touch")) ? "" : " con los sensores <code>Touch*</code>"} y prueba un <code>DETECT_RADIUS</code> más pequeño (ahora ${cText("DETECT_RADIUS")}). Todos los tipos de lluvia (ahora <code>${esc(st("rainType"))}</code>) son patrones fijos: una lluvia que se desplace necesitaría código nuevo.` });
  if (behavFinal !== null && behavFinal < 2)
    findings.push({ level: "info", title: "Poca diversidad de comportamientos", evidence: `${who}: ${fmt(behavFinal, 2)} comportamientos efectivos al final.`, action: st("simulationType") === "generational" ? "Selección muy dura: sube <code>GREATEST_*_SELECTION_TOP_SURVIVORS</code> a 0.1–0.2 o la probabilidad de mutación." : "Sube la probabilidad de mutación o la de inserción/borrado." });
  if (settings.sensors.includes("PreyDistance")) findings.push({ level: "info", title: "PreyDistance activo", evidence: "Vale 999999 cuando no hay presa y satura la red.", action: "Mejor <code>PreyProximity</code> o <code>PreyNorth/East/South/West</code>." });
  if (settings.sensors.includes("Pain")) findings.push({ level: "info", title: "Pain activo", evidence: "Las áreas de salud no se aplican: Pain siempre vale 0 (docs/known-issues.md).", action: "Desactívalo: solo ocupa una posición en la lista." });
  for (const s of ["PredatorDistance", "PredatorDirection"]) if (settings.sensors.includes(s)) findings.push({ level: "warn", title: `${s} activo`, evidence: "No produce ningún valor: los cerebros que lo leen calculan NaN (docs/known-issues.md).", action: "Desactívalo hasta arreglarlo." });
  if (findings.length === 0) findings.push({ level: "ok", title: "Ningún síntoma claro", evidence: "Ninguna regla se ha disparado.", action: "Compara varias semillas o cambia una variable cada vez." });
  const order = { warn: 0, info: 1, ok: 2 };
  findings.sort((a, b) => order[a.level] - order[b.level]);
  sections.splice(1, 0, `<section><h2>Diagnóstico y ajustes</h2><p class="muted">Reglas automáticas sobre el último tercio de las generaciones (desde la ${finalFrom}). Los umbrales son orientativos; están en el código del script.</p>${findings.map((f) =>
    `<div class="finding ${f.level}"><div class="tag">${f.level === "warn" ? "Ajustar" : f.level === "info" ? "Nota" : "OK"}</div><div><b>${esc(f.title)}</b><p>${f.evidence}</p><p>→ ${f.action}</p></div></div>`).join("")}</section>`);

  // ----- HTML -----
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Informe ${esc(run.code)}</title>
<style>
:root { color-scheme: light; --bg:#fcfcfb; --panel:#f3f2ef; --text:#0b0b0b; --text2:#52514e; --muted:#7a7974; --line:#e2e0da;
  --s-1:#2a78d6; --s-animal:#2a78d6; --s-plant:#008300; --s-unknown:#8a8984;
  --d-1:#1baf7a; --d-2:#eda100; --d-3:#e34948; --d-4:#6250d6;
  --g-photo:#1baf7a; --g-plant:#008300; --g-animal:#2a78d6;
  --c-1:#8a8984; --c-2:#6250d6; --c-3:#eb6834; --c-4:#e34948; --c-5:#e87ba4;
  --good:#0a7a33; --bad:#c03030; --warn-bg:#fff4e0; --info-bg:#eaf2fc; --ok-bg:#e8f5ec; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark; --bg:#1a1a19; --panel:#242422; --text:#f0efec; --text2:#c3c2b7; --muted:#99988f; --line:#3a3a37;
  --s-1:#3987e5; --s-animal:#3987e5; --s-plant:#0ca30c; --s-unknown:#99988f; --d-1:#199e70; --d-2:#c98500; --d-3:#e66767; --d-4:#9085e9;
  --g-photo:#199e70; --g-plant:#0ca30c; --g-animal:#3987e5; --c-1:#99988f; --c-2:#9085e9; --c-3:#d95926; --c-4:#e66767; --c-5:#d55181;
  --good:#4cc06e; --bad:#ef7a7a; --warn-bg:#3a2f18; --info-bg:#1d2a3a; --ok-bg:#1c3324; } }
:root[data-theme="dark"] { color-scheme: dark; --bg:#1a1a19; --panel:#242422; --text:#f0efec; --text2:#c3c2b7; --muted:#99988f; --line:#3a3a37;
  --s-1:#3987e5; --s-animal:#3987e5; --s-plant:#0ca30c; --s-unknown:#99988f; --d-1:#199e70; --d-2:#c98500; --d-3:#e66767; --d-4:#9085e9;
  --g-photo:#199e70; --g-plant:#0ca30c; --g-animal:#3987e5; --c-1:#99988f; --c-2:#9085e9; --c-3:#d95926; --c-4:#e66767; --c-5:#d55181;
  --good:#4cc06e; --bad:#ef7a7a; --warn-bg:#3a2f18; --info-bg:#1d2a3a; --ok-bg:#1c3324; }
body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 system-ui, sans-serif; }
main { max-width:1180px; margin:0 auto; padding:24px 16px 64px; }
h1 { font-size:26px; margin:0 0 4px; } h2 { font-size:20px; margin:40px 0 8px; border-bottom:1px solid var(--line); padding-bottom:4px; } h3 { font-size:16px; margin:24px 0 6px; }
p, li { color:var(--text2); max-width:80ch; } .muted { color:var(--muted); } code { font-size:13px; }
.good { color:var(--good); font-weight:600; } .bad { color:var(--bad); font-weight:600; }
dl.ficha { display:grid; grid-template-columns:minmax(140px,220px) 1fr; gap:4px 16px; margin:16px 0; } dl.ficha dt { color:var(--muted); } dl.ficha dd { margin:0; }
.table-wrap { overflow-x:auto; } table { border-collapse:collapse; font-size:13px; margin:8px 0; }
th, td { text-align:left; padding:4px 8px; border-bottom:1px solid var(--line); vertical-align:top; } th { color:var(--muted); font-weight:600; }
.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; } .circuit { font-family:ui-monospace, monospace; font-size:12px; color:var(--text2); }
.grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 420px), 1fr)); gap:16px; }
figure.chart { margin:0; background:var(--panel); border-radius:8px; padding:10px 12px; } figcaption { font-weight:600; font-size:14px; margin-bottom:4px; }
svg { width:100%; height:auto; display:block; } .grid line, line.grid { stroke:var(--line); stroke-width:1; } line.axis { stroke:var(--muted); } text.tick { fill:var(--muted); font-size:11px; }
rect.hit { fill:transparent; } rect.hit:hover { fill:var(--text); fill-opacity:.06; }
.legend { display:flex; flex-wrap:wrap; gap:4px 14px; font-size:12px; color:var(--text2); margin:4px 0; } .legend i { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:5px; vertical-align:-1px; }
.stack { display:flex; gap:2px; width:140px; height:12px; } .stack span { display:block; border-radius:2px; min-width:2px; }
.finding { display:flex; gap:12px; padding:10px 12px; border-radius:8px; margin:8px 0; } .finding p { margin:2px 0; }
.finding.warn { background:var(--warn-bg); } .finding.info { background:var(--info-bg); } .finding.ok { background:var(--ok-bg); }
.tag { font-size:12px; font-weight:700; min-width:56px; color:var(--text); }
</style></head><body><main>
<h1>Informe del log ${esc(run.code)}</h1>
<p class="muted">Generado por experiments/analyze-log.ts el ${new Date().toLocaleString("es-ES")}. Especie relevante: pico de al menos ${MIN_PEAK} creaturas (<code>--min-peak</code>).</p>
<dl class="ficha">${ficha.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
${sections.join("\n")}
<section><h2>Limitaciones</h2><ul>
<li>Los genomas se descodifican con los sensores, acciones y neuronas de <code>settings.csv</code>, es decir, los del inicio de la grabación. Si se cambiaron durante la ejecución, los circuitos de las especies posteriores son incorrectos.</li>
<li>Una especie es un genoma exacto: dos especies casi iguales cuentan por separado. Por eso importan el clado y los comportamientos, que agrupan.</li>
<li>Los circuitos dicen qué está conectado, no cuándo se activa: un peso pequeño puede no disparar nunca la acción. Para verlo en marcha, carga ${files.sim ? `<code>${esc(path.basename(files.sim))}</code>` : "el .sim"} en la app y busca la especie en la pestaña Population.</li>
<li>Las medias de las especies con una o dos creaturas son muy ruidosas.</li>
<li>Para el árbol de especies, abre el fichero de especies en <code>/species-tree.html</code>.</li>
</ul></section>
</main></body></html>`;

  const outFile = path.join(files.dir, option("--out") ?? "report.html");
  fs.writeFileSync(outFile, html);

  // resumen por especie
  const dec = (v: number | null) => (v === null ? "" : String(Math.round(v * 10000) / 10000).replace(".", ","));
  const header = ["speciesId", "speciesParentId", "genus", "firstGen", "lastGen", "generations", "sumAlive", "peak", "clade", "descendants",
    "genomeSize", "links", "neurons", "sensors", "actions", "envSensors", "clockSensors", "avgChildren", "pctDeathBasalConsumption", "pctDeathAttacked", "pctDeathOld", "circuit", "genome"];
  const lines = [header.join(";"), ...[...all].sort((a, b) => b.sumAlive - a.sumAlive).map((s) => [
    s.id, s.parentId, s.genus, s.firstGen, s.lastGen, s.generations, dec(s.sumAlive), s.peak, dec(s.clade), s.descendants,
    s.genomeSize, s.circuit?.links.length ?? "", s.circuit?.neurons ?? "", s.circuit?.sensors.join("|") ?? "", s.circuit?.actions.join("|") ?? "",
    s.circuit?.envSensors ?? "", s.circuit?.clockSensors ?? "", dec(s.perCreature.avgChildren.value), dec(s.deaths.pctDeathBasalConsumption.value),
    dec(s.deaths.pctDeathAttacked.value), dec(s.deaths.pctDeathOld.value), s.circuit?.text ?? "", s.genome,
  ].join(";"))];
  fs.writeFileSync(path.join(files.dir, "species-summary.csv"), lines.join("\n") + "\n");

  console.log(`Ejecución ${run.code} (${run.index} de ${runs.length}), generaciones ${firstGen}-${lastGen}, ${all.length} especies (${relevant.length} relevantes)`);
  console.log(`${findings.filter((f) => f.level === "warn").length} ajustes propuestos, ${findings.filter((f) => f.level === "info").length} notas`);
  console.log(`Informe: ${outFile}`);
  console.log(`Especies: ${path.join(files.dir, "species-summary.csv")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
