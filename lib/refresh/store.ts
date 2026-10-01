import type { ZodType } from "zod";
import { readStoreText, writeStoreText } from "../storage";

/** IST timestamp like 2026-10-02T10:00:00+05:30 (data files use IST). */
export function nowIst(d = new Date()): string {
  return new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 19) + "+05:30";
}

export function todayIst(d = new Date()): string {
  return nowIst(d).slice(0, 10);
}

export async function readDataJson<T>(file: string): Promise<T | null> {
  const text = await readStoreText(file);
  return text === null ? null : (JSON.parse(text) as T);
}

/** Validate, then write. A validation error throws, so the caller keeps the last good file. */
export async function saveValidated<T>(file: string, schema: ZodType<T>, data: unknown): Promise<T> {
  const parsed = schema.parse(data);
  await writeStoreText(file, JSON.stringify(parsed, null, 2) + "\n");
  return parsed;
}

export async function readCache<T>(name: string): Promise<T | null> {
  const text = await readStoreText(`state/${name}`);
  try {
    return text === null ? null : (JSON.parse(text) as T);
  } catch {
    return null;
  }
}

export async function writeCache(name: string, data: unknown): Promise<void> {
  await writeStoreText(`state/${name}`, JSON.stringify(data, null, 2));
}
