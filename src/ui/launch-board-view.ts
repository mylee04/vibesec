import type { ShowcaseEntry } from "../showcase/types.js"
import { formatShowcaseHost } from "./home-showcase-data.js"

export type LaunchBoardPageSize = 25 | 50 | 100

export type LaunchBoardPageInput = {
  readonly page: number
  readonly pageSize: LaunchBoardPageSize
  readonly query: string
}

export type LaunchBoardPage = {
  readonly entries: readonly ShowcaseEntry[]
  readonly page: number
  readonly pageSize: LaunchBoardPageSize
  readonly totalEntries: number
  readonly totalPages: number
}

export const launchBoardPageSizes = [25, 50, 100] as const

export const parseLaunchBoardPageSize = (value: string): LaunchBoardPageSize => {
  switch (value) {
    case "50":
      return 50
    case "100":
      return 100
    default:
      return 25
  }
}

export const buildLaunchBoardPage = (
  entries: readonly ShowcaseEntry[],
  input: LaunchBoardPageInput,
): LaunchBoardPage => {
  const filteredEntries = filterLaunchBoardEntries(entries, input.query)
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / input.pageSize))
  const page = clampPage(input.page, totalPages)
  const start = (page - 1) * input.pageSize
  const end = start + input.pageSize
  return {
    entries: filteredEntries.slice(start, end),
    page,
    pageSize: input.pageSize,
    totalEntries: filteredEntries.length,
    totalPages,
  }
}

export const filterLaunchBoardEntries = (
  entries: readonly ShowcaseEntry[],
  query: string,
): readonly ShowcaseEntry[] => {
  const normalizedQuery = normalizeSearchText(query)
  if (normalizedQuery.length === 0) {
    return entries
  }
  return entries.filter((entry) => searchableEntryText(entry).includes(normalizedQuery))
}

const clampPage = (page: number, totalPages: number): number => {
  if (!Number.isFinite(page)) {
    return 1
  }
  return Math.min(Math.max(1, Math.trunc(page)), totalPages)
}

const searchableEntryText = (entry: ShowcaseEntry): string =>
  normalizeSearchText(
    [
      entry.appName,
      entry.appUrl,
      formatShowcaseHost(entry.appUrl),
      entry.tagline,
      entry.category,
      ...entry.stack,
    ].join(" "),
  )

const normalizeSearchText = (value: string): string => value.trim().toLowerCase()
