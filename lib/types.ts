export type MedalType = "gold" | "silver" | "bronze";

export interface MedalEntry {
  type: MedalType;
  sport: string;
  event: string;
  athletes: string[];
  date: string; // YYYY-MM-DD
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  gold: number;
  silver: number;
  bronze: number;
  medals: MedalEntry[];
}

export interface MedalsData {
  lastUpdated: string;
  countries: Country[];
}

export interface RankedCountry extends Country {
  rank: number;
  total: number;
}

export type Likelihood = "high" | "medium" | "long-shot";

export interface ForecastItem {
  sport: string;
  event: string;
  athletes: string[];
  eventDate: string; // YYYY-MM-DD
  likelihood: Likelihood;
  potentialMedal: MedalType;
  reason: string;
}

export interface ForecastData {
  generatedAt: string;
  source: string;
  items: ForecastItem[];
}

export interface NewsItem {
  title: string;
  summary?: string;
  source: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  isIndia: boolean;
}

export interface NewsData {
  items: NewsItem[];
}
