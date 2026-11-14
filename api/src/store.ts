import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StoreData } from "./types.js";
import { buildSeed } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const dataDir = path.resolve(__dirname, "../data");
export const storePath = path.join(dataDir, "store.json");

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export function loadStore(): StoreData {
  ensureDir();
  if (!fs.existsSync(storePath)) {
    const seed = buildSeed();
    saveStore(seed);
    return seed;
  }
  const raw = fs.readFileSync(storePath, "utf8");
  return JSON.parse(raw) as StoreData;
}

export function saveStore(data: StoreData) {
  ensureDir();
  const tmp = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, storePath);
}

let cache: StoreData | null = null;

export function getStore(): StoreData {
  if (!cache) cache = loadStore();
  return cache;
}

export function mutateStore<T>(fn: (store: StoreData) => T): T {
  const store = getStore();
  const result = fn(store);
  saveStore(store);
  return result;
}

export function resetStore() {
  cache = buildSeed();
  saveStore(cache);
  return cache;
}
