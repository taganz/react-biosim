// Scenarios saved by the user in this browser (IndexedDB). Not the scenarios of the Start tab.
// The JSON of a scenario can be large, so it is kept apart from the list shown in the UI.

/** setup: settings and map, loads from generation 1. generationStart: also the genomes of a generation */
export type UserScenarioKind = "setup" | "generationStart";

export type UserScenarioInfo = {
  id: string;
  name: string;
  kind: UserScenarioKind;
  /** generation the scenario starts at */
  generation: number;
  simCode: string;
  createdAt: number;
  /** size of the JSON, in characters */
  size: number;
};

const DB_NAME = "biosim";
const DB_VERSION = 1;
const INFO_STORE = "userScenarios";
const DATA_STORE = "userScenarioData";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("this browser cannot store scenarios (IndexedDB is not available)."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INFO_STORE)) db.createObjectStore(INFO_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(DATA_STORE)) db.createObjectStore(DATA_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// runs fn in one transaction and resolves with the result of its last request when the transaction completes
async function transaction<T>(
  mode: IDBTransactionMode,
  fn: (info: IDBObjectStore, data: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> {
  const db = await openDatabase();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction([INFO_STORE, DATA_STORE], mode);
      const request = fn(tx.objectStore(INFO_STORE), tx.objectStore(DATA_STORE));
      tx.oncomplete = () => resolve(request ? request.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("the browser could not save the scenario (storage full?)."));
    });
  } finally {
    db.close();
  }
}

/** Newest first */
export async function listUserScenarios(): Promise<UserScenarioInfo[]> {
  const list = (await transaction<UserScenarioInfo[]>("readonly", (info) => info.getAll())) ?? [];
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveUserScenario(
  scenario: Omit<UserScenarioInfo, "id" | "createdAt" | "size">,
  json: string
): Promise<UserScenarioInfo> {
  const info: UserScenarioInfo = {
    ...scenario,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    size: json.length,
  };
  await transaction("readwrite", (infoStore, dataStore) => {
    dataStore.put(json, info.id);
    infoStore.put(info);
  });
  return info;
}

export async function readUserScenario(id: string): Promise<string> {
  const json = await transaction<string>("readonly", (_, data) => data.get(id));
  if (json === undefined) throw new Error("the scenario is no longer stored in this browser.");
  return json;
}

export async function renameUserScenario(info: UserScenarioInfo, name: string): Promise<void> {
  await transaction("readwrite", (infoStore) => {
    infoStore.put({ ...info, name });
  });
}

export async function deleteUserScenario(id: string): Promise<void> {
  await transaction("readwrite", (infoStore, dataStore) => {
    infoStore.delete(id);
    dataStore.delete(id);
  });
}
