import { promises as fs } from "fs";
import path from "path";
import { BlobAccessError, BlobNotFoundError, get, put } from "@vercel/blob";

// Where the JSON lives:
// - Vercel (BLOB_READ_WRITE_TOKEN, or BLOB_STORE_ID with Vercel's automatic OIDC login): Vercel Blob, because the serverless filesystem is read-only.
//   Reads fall back to the copy committed in /data, so the first deploy works before any refresh has run.
// - Local: plain files in /data (data files) and /.cache (refresh state).
// Names: "medals.json" -> data/medals.json, "state/medals.json" -> .cache/medals.json.

export const usingBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

function localPath(name: string): string {
  return name.startsWith("state/")
    ? path.join(process.cwd(), ".cache", name.slice(6))
    : path.join(process.cwd(), "data", name);
}

async function readLocal(name: string): Promise<string | null> {
  try {
    return await fs.readFile(localPath(name), "utf-8");
  } catch {
    return null;
  }
}

// A Blob store is either private or public, and every call must match it. New stores are private by default.
// Set BLOB_ACCESS=public if you created a public store. If the guess is wrong we try the other mode and remember it.
type Access = "private" | "public";
let access: Access = process.env.BLOB_ACCESS === "public" ? "public" : "private";
const other = (a: Access): Access => (a === "private" ? "public" : "private");

async function withAccess<T>(fn: (a: Access) => Promise<T>): Promise<T> {
  try {
    return await fn(access);
  } catch (e) {
    if (!(e instanceof BlobAccessError)) throw e;
    const result = await fn(other(access)); // wrong guess: use the other mode from now on
    access = other(access);
    return result;
  }
}

async function readBlob(name: string): Promise<string | null> {
  try {
    const res = await withAccess((a) => get(name, { access: a, useCache: false }));
    if (!res || res.statusCode !== 200) return null;
    return await new Response(res.stream).text();
  } catch (e) {
    if (e instanceof BlobNotFoundError) return null;
    throw e;
  }
}

export async function readStoreText(name: string): Promise<string | null> {
  if (usingBlob()) {
    const fromBlob = await readBlob(name);
    if (fromBlob !== null) return fromBlob;
    return name.startsWith("state/") ? null : readLocal(name); // committed copy as fallback
  }
  return readLocal(name);
}

export async function writeStoreText(name: string, text: string): Promise<void> {
  if (usingBlob()) {
    await withAccess((a) =>
      put(name, text, {
        access: a,
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
      }),
    );
    return;
  }
  const target = localPath(name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`; // temp file + rename: never leave a half-written file
  await fs.writeFile(tmp, text);
  await fs.rename(tmp, target);
}
