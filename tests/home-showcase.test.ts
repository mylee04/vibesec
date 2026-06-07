import { describe, expect, it } from "bun:test"
import { formatShowcaseHost, selectHomeShowcaseEntries } from "../src/ui/home-showcase-data.js"
import { getCopy, parseLanguage, publicRiskLabel } from "../src/ui/i18n.js"

describe("home showcase preview", () => {
  it("shows the VibeSec launch when no public entries are available", () => {
    // Given: the public showcase API has no persisted entries.
    const entries = [] as const

    // When: the home page chooses preview entries.
    const selected = selectHomeShowcaseEntries(entries)

    // Then: the scanner still advertises a real public launch before scan.
    expect(selected).toHaveLength(1)
    expect(selected[0]?.appName).toBe("VibeSec")
    expect(selected[0]?.appUrl).toBe("https://vibesec.bymyleslee.com/")
  })

  it("formats the app domain for promotional cards", () => {
    expect(formatShowcaseHost("https://www.example.com/path")).toBe("example.com")
  })

  it("keeps translated labels selectable", () => {
    expect(parseLanguage("ko")).toBe("ko")
    expect(parseLanguage("es")).toBe("es")
    expect(parseLanguage("ja")).toBe("ja")
    expect(getCopy("ko").scanner.runScan).toBe("점수 받기")
    expect(getCopy("es").scanner.runScan).toBe("Obtener score")
    expect(getCopy("ja").scanner.runScan).toBe("スコア取得")
    expect(publicRiskLabel("Low", getCopy("ru"))).toBe("Низкий риск")
  })
})
