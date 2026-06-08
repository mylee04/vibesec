import type { ShowcaseEntry } from "../showcase/types.js"

export type LaunchBoardSort = "hot" | "popular" | "latest"

export const sortLaunchBoardEntries = (
  entries: readonly ShowcaseEntry[],
  sort: LaunchBoardSort,
  now: Date = new Date(),
): readonly ShowcaseEntry[] =>
  [...entries].sort((left, right) => {
    switch (sort) {
      case "hot": {
        const scoreDelta = hotScoreFor(right, now) - hotScoreFor(left, now)
        return scoreDelta === 0 ? right.createdAt.localeCompare(left.createdAt) : scoreDelta
      }
      case "popular": {
        const voteDelta = right.upvotes - left.upvotes
        if (voteDelta !== 0) {
          return voteDelta
        }
        const commentDelta = right.comments.length - left.comments.length
        if (commentDelta !== 0) {
          return commentDelta
        }
        return right.createdAt.localeCompare(left.createdAt)
      }
      case "latest":
        return right.createdAt.localeCompare(left.createdAt)
    }
    return right.createdAt.localeCompare(left.createdAt)
  })

const hotScoreFor = (entry: ShowcaseEntry, now: Date): number => {
  const ageMs = now.getTime() - new Date(entry.createdAt).getTime()
  const ageHours = Math.max(0, ageMs / 3_600_000)
  const recencyBoost = Math.max(0, 72 - ageHours) / 12
  return entry.upvotes * 4 + entry.comments.length * 2 + recencyBoost
}
