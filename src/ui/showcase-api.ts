import ky from "ky"
import {
  ShowcaseCreateResponseSchema,
  type ShowcaseEntry,
  ShowcaseListResponseSchema,
  ShowcaseMutationResponseSchema,
} from "../showcase/types.js"

export type ShowcaseSubmission = {
  readonly appName: string
  readonly appUrl: string
  readonly tagline: string
  readonly category: string
  readonly stack: readonly string[]
}

export const listShowcaseEntries = async (): Promise<readonly ShowcaseEntry[]> => {
  const payload = await ky.get("/api/showcase", { timeout: 10_000 }).json()
  return ShowcaseListResponseSchema.parse(payload).entries
}

export const publishShowcaseEntry = async (
  submission: ShowcaseSubmission,
): Promise<ShowcaseEntry> => {
  const payload = await ky
    .post("/api/showcase", {
      json: submission,
      timeout: 30_000,
    })
    .json()
  return ShowcaseCreateResponseSchema.parse(payload).entry
}

export const upvoteShowcaseEntry = async (entryId: string): Promise<ShowcaseEntry> => {
  const payload = await ky
    .post("/api/showcase-upvote", {
      json: { entryId },
      timeout: 10_000,
    })
    .json()
  return ShowcaseMutationResponseSchema.parse(payload).entry
}

export const commentShowcaseEntry = async (input: {
  readonly entryId: string
  readonly authorName: string
  readonly body: string
}): Promise<ShowcaseEntry> => {
  const payload = await ky
    .post("/api/showcase-comment", {
      json: input,
      timeout: 10_000,
    })
    .json()
  return ShowcaseMutationResponseSchema.parse(payload).entry
}
