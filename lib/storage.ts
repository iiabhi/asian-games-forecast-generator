import { promises as fs } from "fs";
import path from "path";
import { BlobNotFoundError, head, put } from "@vercel/blob";

// Where the JSON lives:
// - Vercel (BLOB_READ_WRITE_TOKEN set): Vercel Blob, because the serverless filesystem is read-only.
//   Reads fall back to the copy committed in /data, so the first deploy works before any refresh has run.
// - Local: plain files in /data (data files) and /.cache (refresh state).
// Names: "medals.json" -> data/medals.json, "state/medals.json" -> .cache/medals.json.

export const usingBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

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

async function readBlob(name: string): Promise<string | null> {
  try {
    const meta = await head(name);
    // uploadedAt busts the CDN cache whenever the blob is overwritten
    const res = await fetch(`${meta.url}?v=${meta.uploadedAt.getTime()}`, { cache: "no-store" });
    return res.ok ? await res.text() : null;
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
    await put(name, text, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    return;
  }
  const target = localPath(name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`; // temp file + rename: never leave a half-written file
  await fs.writeFile(tmp, text);
  await fs.rename(tmp, target);
}
