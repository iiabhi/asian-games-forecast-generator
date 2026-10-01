import { z } from "zod";

// Runtime validation for the JSON files. Keep in sync with lib/types.ts.
const medalType = z.enum(["gold", "silver", "bronze"]);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const medalsSchema = z.object({
  lastUpdated: z.string().datetime({ offset: true }),
  countries: z
    .array(
      z.object({
        code: z.string().min(2),
        name: z.string().min(1),
        flag: z.string().min(1),
        gold: z.number().int().nonnegative(),
        silver: z.number().int().nonnegative(),
        bronze: z.number().int().nonnegative(),
        medals: z.array(
          z.object({
            type: medalType,
            sport: z.string().min(1),
            event: z.string().min(1),
            athletes: z.array(z.string().min(1)),
            date: day,
          }),
        ),
      }),
    )
    .refine((cs) => cs.some((c) => c.code === "IND"), "India (IND) must be present"),
});

export const forecastSchema = z.object({
  generatedAt: z.string().datetime({ offset: true }),
  source: z.string(),
  items: z.array(
    z.object({
      sport: z.string().min(1),
      event: z.string().min(1),
      athletes: z.array(z.string().min(1)).min(1),
      eventDate: day,
      likelihood: z.enum(["high", "medium", "long-shot"]),
      potentialMedal: medalType,
      reason: z.string().min(1),
    }),
  ),
});

export const newsSchema = z.object({
  items: z.array(
    z.object({
      title: z.string().min(1),
      summary: z.string().optional(),
      source: z.string(),
      url: z.string().url(),
      imageUrl: z.string().url().nullable(),
      publishedAt: z.string().datetime({ offset: true }),
      isIndia: z.boolean(),
    }),
  ),
});

export const remainingSchema = z.array(
  z.object({
    sport: z.string().min(1),
    event: z.string().min(1),
    date: day,
    india_entries: z.array(z.string().min(1)).min(1),
    stage: z.string().optional(),
  }),
);
