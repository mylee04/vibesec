import { AlertTriangle } from "lucide-react"
import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { buildReportViewModel } from "../reporting/view-model.js"
import type { ScanReport } from "../scanner/types.js"
import { scanUrl } from "./api.js"
import { AppNav } from "./app-nav.js"
import { HomeShowcase } from "./home-showcase.js"
import {
  applyLanguage,
  getCopy,
  getInitialLanguage,
  type Language,
  persistLanguage,
} from "./i18n.js"
import { Report } from "./report.js"
import { ScannerForm } from "./scanner-form.js"
import { ShowcaseDetailPage, ShowcasePage } from "./showcase-pages.js"

type ScanState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "ready"; readonly report: ScanReport }

const exampleUrl = "https://vibesec.bymyleslee.com/"

export const App = () => {
  const pathname = window.location.pathname
  const [url, setUrl] = useState(exampleUrl)
  const [state, setState] = useState<ScanState>({ kind: "idle" })
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const labels = getCopy(language)
  const reportModel = useMemo(() => {
    if (state.kind !== "ready") {
      return undefined
    }
    return buildReportViewModel(state.report)
  }, [state])
  const showcaseCtaHref = state.kind === "ready" ? "#showcase-publish" : "#scan-url"

  useEffect(() => {
    applyLanguage(language)
  }, [language])

  const changeLanguage = (nextLanguage: Language) => {
    persistLanguage(nextLanguage)
    setLanguage(nextLanguage)
  }

  const submitScan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setState({ kind: "loading" })
    try {
      const report = await scanUrl(url)
      setState({ kind: "ready", report })
    } catch (error) {
      if (error instanceof Error) {
        setState({ kind: "error", message: error.message })
        return
      }
      throw error
    }
  }

  const content = (() => {
    if (pathname === "/showcase" || pathname === "/community") {
      return <ShowcasePage labels={labels} />
    }

    if (pathname.startsWith("/s/")) {
      return (
        <ShowcaseDetailPage
          entryId={decodeURIComponent(pathname.replace("/s/", ""))}
          labels={labels}
          language={language}
        />
      )
    }

    return (
      <>
        <ScannerForm
          url={url}
          isLoading={state.kind === "loading"}
          labels={labels}
          onUrlChange={setUrl}
          onSubmit={submitScan}
        />

        {state.kind === "error" ? (
          <div className="error-box" role="alert">
            <AlertTriangle size={18} aria-hidden="true" />
            {state.message}
          </div>
        ) : null}

        {state.kind === "ready" && reportModel !== undefined ? (
          <Report report={state.report} model={reportModel} labels={labels} />
        ) : null}

        <HomeShowcase labels={labels} ctaHref={showcaseCtaHref} />
      </>
    )
  })()

  return (
    <main className="shell">
      <AppNav
        currentPath={pathname}
        labels={labels}
        language={language}
        onLanguageChange={changeLanguage}
      />
      {content}
    </main>
  )
}
