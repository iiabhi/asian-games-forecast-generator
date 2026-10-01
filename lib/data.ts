import { unstable_cache } from "next/cache";
import { readStoreText, usingBlob } from "./storage";
import type { ForecastData, MedalsData, NewsData } from "./types";

// Pages read data only through these three functions. Swapping sources later means changing only these.
// Local: reads /data/*.json on every request, so editing a file shows up immediately.
// Vercel: reads from Vercel Blob (falls back to the committed /data copy), cached for 60s and
// invalidated right after /api/refresh writes new data (tag "data").
async function load<T>(file: string): Promise<T> {
  const text = await readStoreText(file);
  if (text === null) throw new Error(`${file} not found`);
  return JSON.parse(text) as T;
}

const loadCached = unstable_cache((file: string) => load<unknown>(file), ["data-file"], {
  revalidate: 60,
  tags: ["data"],
});

const read = <T>(file: string): Promise<T> => (usingBlob() ? (loadCached(file) as Promise<T>) : load<T>(file));

export async function getMedals(): Promise<MedalsData> {
  return read<MedalsData>("medals.json");
}

export async function getForecast(): Promise<ForecastData> {
  return read<ForecastData>("forecast.json");
}

export async function getNews(): Promise<NewsData> {
  const data = await read<NewsData>("news.json");
  return { items: [...data.items].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)) };
}
