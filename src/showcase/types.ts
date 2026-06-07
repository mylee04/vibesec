import { z } from "zod"

export const ShowcaseEntrySchema = z.object({
  id: z.string(),
  appName: z.string(),
  appUrl: z.string(),
  tagline: z.string(),
  category: z.string(),
  stack: z.array(z.string()),
  score: z.number().int().min(0).max(100),
  grade: z.string(),
  risk: z.string(),
  createdAt: z.string(),
  lastScannedAt: z.string(),
})

export const ShowcaseEntryListSchema = z.array(ShowcaseEntrySchema)

export const ShowcaseListResponseSchema = z.object({
  entries: ShowcaseEntryListSchema,
})

export const ShowcaseCreateResponseSchema = z.object({
  entry: ShowcaseEntrySchema,
})

export type ShowcaseEntry = z.infer<typeof ShowcaseEntrySchema>
