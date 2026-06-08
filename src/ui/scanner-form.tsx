import { ArrowRight, Globe, ShieldCheck } from "lucide-react"
import type { FormEvent } from "react"
import type { UiCopy } from "./i18n.js"

type ScannerFormProps = {
  readonly url: string
  readonly isLoading: boolean
  readonly labels: UiCopy
  readonly onUrlChange: (url: string) => void
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export const ScannerForm = ({
  url,
  isLoading,
  labels,
  onUrlChange,
  onSubmit,
}: ScannerFormProps) => (
  <section className="scan-surface">
    <div className="brand-block">
      <div className="mark" aria-hidden="true">
        <ShieldCheck size={26} />
      </div>
      <div>
        <p className="eyebrow">{labels.scanner.eyebrow}</p>
        <h1>{labels.scanner.title}</h1>
        <p className="hero-subtitle">{labels.scanner.subtitle}</p>
      </div>
    </div>

    <form className="scan-form" onSubmit={onSubmit}>
      <label htmlFor="scan-url">{labels.scanner.urlLabel}</label>
      <div className="input-row">
        <div className="input-shell">
          <Globe size={19} aria-hidden="true" />
          <input
            id="scan-url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            value={url}
            placeholder={labels.scanner.placeholder}
            onChange={(event) => onUrlChange(event.currentTarget.value)}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? labels.scanner.scanning : labels.scanner.runScan}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  </section>
)
