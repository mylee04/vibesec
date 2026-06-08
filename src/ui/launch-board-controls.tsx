import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import type { ChangeEvent } from "react"
import type { UiCopy } from "./i18n.js"
import {
  type LaunchBoardPage,
  type LaunchBoardPageSize,
  launchBoardPageSizes,
  parseLaunchBoardPageSize,
} from "./launch-board-view.js"

type LaunchBoardControlsProps = {
  readonly labels: UiCopy
  readonly page: LaunchBoardPage
  readonly query: string
  readonly onQueryChange: (query: string) => void
  readonly onPageChange: (page: number) => void
  readonly onPageSizeChange: (pageSize: LaunchBoardPageSize) => void
}

export const LaunchBoardControls = ({
  labels,
  page,
  query,
  onQueryChange,
  onPageChange,
  onPageSizeChange,
}: LaunchBoardControlsProps) => {
  const updatePage = (event: ChangeEvent<HTMLInputElement>) => {
    onPageChange(Number.parseInt(event.currentTarget.value, 10))
  }

  return (
    <section className="launch-board-controls" aria-label={labels.showcase.controls}>
      <label className="launch-board-search">
        <Search size={17} aria-hidden="true" />
        <input
          value={query}
          placeholder={labels.showcase.searchPlaceholder}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
        />
      </label>
      <div className="launch-board-pagination">
        <label>
          <span>{labels.showcase.pageSize}</span>
          <select
            value={page.pageSize}
            onChange={(event) =>
              onPageSizeChange(parseLaunchBoardPageSize(event.currentTarget.value))
            }
          >
            {launchBoardPageSizes.map((size) => (
              <option value={size} key={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <span className="launch-board-result-count">
          {labels.showcase.results(page.totalEntries)}
        </span>
        <div className="launch-board-page-stepper">
          <button
            type="button"
            onClick={() => onPageChange(page.page - 1)}
            disabled={page.page <= 1}
            aria-label={labels.showcase.previousPage}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <label>
            <span>{labels.showcase.page}</span>
            <input
              type="number"
              min={1}
              max={page.totalPages}
              value={page.page}
              onChange={updatePage}
            />
            <span>{labels.showcase.of(page.totalPages)}</span>
          </label>
          <button
            type="button"
            onClick={() => onPageChange(page.page + 1)}
            disabled={page.page >= page.totalPages}
            aria-label={labels.showcase.nextPage}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
