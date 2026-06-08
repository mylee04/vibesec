const upvoteStorageKey = "vibesec_upvoted_entries"

const storedEntryIds = (): readonly string[] => {
  const stored = globalThis.localStorage?.getItem(upvoteStorageKey)
  if (stored === undefined || stored === null || stored.length === 0) {
    return []
  }
  return stored.split("\n").filter((entryId) => entryId.length > 0)
}

export const hasStoredUpvote = (entryId: string): boolean => storedEntryIds().includes(entryId)

export const storeUpvote = (entryId: string): void => {
  const entryIds = new Set(storedEntryIds())
  entryIds.add(entryId)
  globalThis.localStorage?.setItem(upvoteStorageKey, [...entryIds].join("\n"))
}
